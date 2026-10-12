create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table devices (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id),
  name text not null,
  kind text not null check (kind in ('browser', 'python')),
  key_hash text not null unique,
  mic_profile jsonb,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key,
  device_id uuid not null references devices(id),
  room_id uuid not null references rooms(id),
  started_at timestamptz not null,
  received_at timestamptz not null default now(),
  duration_ms integer not null,
  type text not null check (
    type in ('silverpush', 'lisnr', 'mosquito', 'chirp', 'tone', 'noise', 'unknown')
  ),
  confidence real not null check (confidence between 0 and 1),
  peak_freq_hz real not null,
  freqs_hz real[] not null,
  snr_db real not null,
  payload text,
  sample_rate integer not null,
  is_known_source boolean not null default false
);

create index events_room_started_at_idx on events (room_id, started_at desc);

alter table users enable row level security;
alter table rooms enable row level security;
alter table devices enable row level security;
alter table events enable row level security;