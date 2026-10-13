create table alerts (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  type text not null check (type in ('room_silent', 'room_back', 'beacon')),
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index alerts_room_created_at_idx on alerts (room_id, created_at desc);

alter table alerts enable row level security;
