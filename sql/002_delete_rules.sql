alter table devices
  drop constraint devices_room_id_fkey,
  add constraint devices_room_id_fkey
    foreign key (room_id) references rooms(id) on delete cascade;

alter table events
  drop constraint events_room_id_fkey,
  add constraint events_room_id_fkey
    foreign key (room_id) references rooms(id) on delete cascade;

alter table events alter column device_id drop not null;

alter table events
  drop constraint events_device_id_fkey,
  add constraint events_device_id_fkey
    foreign key (device_id) references devices(id) on delete set null;
