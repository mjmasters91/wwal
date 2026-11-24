-- Grants let the Data API roles reach a table. Policies decide which rows.
-- authenticated writes are still rejected unless a policy agrees, and the
-- guards migration blocks column tricks such as self-promoting is_admin.

grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

-- Profiles -------------------------------------------------------------------

create policy profiles_select on public.profiles
  for select to anon, authenticated
  using (true);

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (
    id = (select auth.uid())
    and is_admin = false
  );

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or private.is_admin())
  with check (id = (select auth.uid()) or private.is_admin());

create policy profiles_delete on public.profiles
  for delete to authenticated
  using (private.is_admin());

-- Teams ----------------------------------------------------------------------

create policy teams_select on public.teams
  for select to anon, authenticated
  using (true);

create policy teams_insert on public.teams
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and not private.is_banned((select auth.uid()))
    and not private.is_on_team((select auth.uid()))
  );

create policy teams_update on public.teams
  for update to authenticated
  using (private.is_admin() or private.is_team_staff(id))
  with check (private.is_admin() or private.is_team_staff(id));

create policy teams_delete on public.teams
  for delete to authenticated
  using (private.is_admin());

-- Roster. Inserts happen from security definer triggers (create coven, accept
-- invite) or from a steward. Captains change roles. Players may leave.

create policy team_members_select on public.team_members
  for select to anon, authenticated
  using (true);

create policy team_members_insert on public.team_members
  for insert to authenticated
  with check (private.is_admin());

create policy team_members_update on public.team_members
  for update to authenticated
  using (private.is_admin() or private.team_role(team_id) = 'captain')
  with check (private.is_admin() or private.team_role(team_id) = 'captain');

create policy team_members_delete on public.team_members
  for delete to authenticated
  using (
    private.is_admin()
    or profile_id = (select auth.uid())
    or private.team_role(team_id) = 'captain'
  );

-- Invites --------------------------------------------------------------------

create policy team_invites_select on public.team_invites
  for select to authenticated
  using (
    private.is_admin()
    or invitee_id = (select auth.uid())
    or private.is_team_staff(team_id)
  );

create policy team_invites_insert on public.team_invites
  for insert to authenticated
  with check (
    status = 'pending'
    and inviter_id = (select auth.uid())
    and not private.is_banned((select auth.uid()))
    and (private.is_admin() or private.is_team_staff(team_id))
  );

create policy team_invites_update on public.team_invites
  for update to authenticated
  using (
    private.is_admin()
    or invitee_id = (select auth.uid())
    or private.is_team_staff(team_id)
  )
  with check (
    private.is_admin()
    or (invitee_id = (select auth.uid()) and status in ('accepted', 'declined'))
    or (private.is_team_staff(team_id) and status = 'revoked')
  );

-- Season structure -----------------------------------------------------------

create policy seasons_select on public.seasons
  for select to anon, authenticated
  using (true);

create policy seasons_write on public.seasons
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy divisions_select on public.divisions
  for select to anon, authenticated
  using (true);

create policy divisions_write on public.divisions
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy registrations_select on public.registrations
  for select to anon, authenticated
  using (true);

create policy registrations_insert on public.registrations
  for insert to authenticated
  with check (
    status = 'pending'
    and registered_by = (select auth.uid())
    and not private.is_banned((select auth.uid()))
    and (private.is_admin() or private.is_team_staff(team_id))
  );

create policy registrations_update on public.registrations
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- Matches and the room -------------------------------------------------------

create policy matches_select on public.matches
  for select to anon, authenticated
  using (true);

create policy matches_insert on public.matches
  for insert to authenticated
  with check (private.is_admin());

create policy matches_update on public.matches
  for update to authenticated
  using (private.is_admin() or private.is_match_staff(id))
  with check (private.is_admin() or private.is_match_staff(id));

create policy matches_delete on public.matches
  for delete to authenticated
  using (private.is_admin());

create policy map_actions_select on public.map_actions
  for select to anon, authenticated
  using (true);

create policy map_actions_insert on public.map_actions
  for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and not private.is_banned((select auth.uid()))
    and (private.is_admin() or private.is_team_staff(team_id))
  );

create policy map_actions_delete on public.map_actions
  for delete to authenticated
  using (private.is_admin());

create policy reschedule_select on public.reschedule_proposals
  for select to anon, authenticated
  using (true);

create policy reschedule_insert on public.reschedule_proposals
  for insert to authenticated
  with check (
    status = 'pending'
    and proposed_by = (select auth.uid())
    and not private.is_banned((select auth.uid()))
    and (private.is_admin() or private.is_team_staff(proposed_by_team))
  );

create policy reschedule_update on public.reschedule_proposals
  for update to authenticated
  using (
    status = 'pending'
    and (
      private.is_admin()
      or private.is_opposing_staff(match_id, proposed_by_team)
    )
  )
  with check (
    status in ('accepted', 'declined')
    and (
      private.is_admin()
      or private.is_opposing_staff(match_id, proposed_by_team)
    )
  );

create policy score_reports_select on public.score_reports
  for select to anon, authenticated
  using (
    status = 'confirmed'
    or private.is_admin()
    or private.is_match_participant(match_id)
  );

create policy score_reports_insert on public.score_reports
  for insert to authenticated
  with check (
    status = 'pending'
    and reporter_id = (select auth.uid())
    and not private.is_banned((select auth.uid()))
    and (private.is_admin() or private.is_team_staff(team_id))
  );

create policy score_reports_update on public.score_reports
  for update to authenticated
  using (
    private.is_admin()
    or (
      status = 'pending'
      and private.is_opposing_staff(match_id, team_id)
    )
  )
  with check (
    private.is_admin()
    or status in ('confirmed', 'rejected')
  );

create policy disputes_select on public.disputes
  for select to authenticated
  using (
    private.is_admin()
    or private.is_match_participant(match_id)
  );

create policy disputes_insert on public.disputes
  for insert to authenticated
  with check (
    status = 'open'
    and opened_by = (select auth.uid())
    and not private.is_banned((select auth.uid()))
    and (private.is_admin() or private.is_match_staff(match_id))
  );

create policy disputes_update on public.disputes
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy forfeits_select on public.forfeit_events
  for select to anon, authenticated
  using (true);

create policy forfeits_insert on public.forfeit_events
  for insert to authenticated
  with check (
    recorded_by = (select auth.uid())
    and not private.is_banned((select auth.uid()))
    and (private.is_admin() or private.is_team_staff(team_id))
  );

-- News, forum, support, bans -------------------------------------------------

create policy news_select on public.news_posts
  for select to anon, authenticated
  using (published = true or private.is_admin());

create policy news_write on public.news_posts
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy boards_select on public.forum_boards
  for select to anon, authenticated
  using (true);

create policy boards_write on public.forum_boards
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy threads_select on public.forum_threads
  for select to anon, authenticated
  using (true);

create policy threads_insert on public.forum_threads
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and not private.is_banned((select auth.uid()))
  );

create policy threads_update on public.forum_threads
  for update to authenticated
  using (author_id = (select auth.uid()) or private.is_admin())
  with check (author_id = (select auth.uid()) or private.is_admin());

create policy threads_delete on public.forum_threads
  for delete to authenticated
  using (private.is_admin());

create policy replies_select on public.forum_replies
  for select to anon, authenticated
  using (true);

create policy replies_insert on public.forum_replies
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and not private.is_banned((select auth.uid()))
    and not exists (
      select 1
      from public.forum_threads t
      where t.id = thread_id
        and t.locked
    )
  );

create policy replies_delete on public.forum_replies
  for delete to authenticated
  using (private.is_admin());

create policy tickets_select on public.tickets
  for select to authenticated
  using (author_id = (select auth.uid()) or private.is_admin());

create policy tickets_insert on public.tickets
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and status = 'open'
    and not private.is_banned((select auth.uid()))
  );

create policy tickets_update on public.tickets
  for update to authenticated
  using (author_id = (select auth.uid()) or private.is_admin())
  with check (author_id = (select auth.uid()) or private.is_admin());

create policy ticket_messages_select on public.ticket_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.tickets t where t.id = ticket_id
    )
  );

create policy ticket_messages_insert on public.ticket_messages
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and not private.is_banned((select auth.uid()))
    and exists (
      select 1 from public.tickets t where t.id = ticket_id
    )
  );

create policy bans_select on public.bans
  for select to anon, authenticated
  using (true);

create policy bans_insert on public.bans
  for insert to authenticated
  with check (private.is_admin() and issued_by = (select auth.uid()));

create policy bans_update on public.bans
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());
