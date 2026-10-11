insert into rooms (name) values ('Dev room') returning id;

insert into devices (room_id, name, kind, key_hash)
values ('<room id from above>', 'Dev listener', 'browser', 'dev')
returning id;