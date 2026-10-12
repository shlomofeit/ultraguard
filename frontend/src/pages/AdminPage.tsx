import { useEffect, useState } from "react";
import { useAdminStore } from "../store/adminStore";
import type { Room, RoomInput } from "../types/room";
import type { Device } from "../types/device";
import RoomForm from "../components/RoomForm";
import RoomsList from "../components/RoomsList";
import DeviceForm from "../components/DeviceForm";
import DeviceKeyBox from "../components/DeviceKeyBox";
import DevicesTable from "../components/DevicesTable";

const AdminPage = () => {
  const rooms = useAdminStore((state) => state.rooms);
  const devices = useAdminStore((state) => state.devices);
  const newDeviceKey = useAdminStore((state) => state.newDeviceKey);
  const isLoading = useAdminStore((state) => state.isLoading);
  const error = useAdminStore((state) => state.error);
  const setAdminData = useAdminStore((state) => state.setAdminData);
  const setNewRoom = useAdminStore((state) => state.setNewRoom);
  const setEditedRoom = useAdminStore((state) => state.setEditedRoom);
  const removeRoom = useAdminStore((state) => state.removeRoom);
  const setNewDevice = useAdminStore((state) => state.setNewDevice);
  const setRevokedDevice = useAdminStore((state) => state.setRevokedDevice);
  const removeDevice = useAdminStore((state) => state.removeDevice);
  const removeNewDeviceKey = useAdminStore((state) => state.removeNewDeviceKey);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  useEffect(() => {
    setAdminData();
    return () => removeNewDeviceKey();
  }, [setAdminData, removeNewDeviceKey]);

  const handleRoomSubmit = (input: RoomInput) => {
    if (editingRoom) {
      setEditedRoom(editingRoom.id, input);
      setEditingRoom(null);
    } else {
      setNewRoom(input);
    }
  };

  const handleDeleteRoom = (room: Room) => {
    const devicesCount = devices.filter(
      (device) => device.roomId === room.id,
    ).length;
    const isConfirmed = window.confirm(
      `למחוק את החדר "${room.name}"? יימחקו גם ${devicesCount} המכשירים שלו וכל האירועים שנקלטו בו. אי אפשר לבטל את זה.`,
    );
    if (isConfirmed) {
      removeRoom(room.id);
    }
  };

  const handleRevokeDevice = (device: Device) => {
    const isConfirmed = window.confirm(
      `לבטל את המפתח של "${device.name}"? המכשיר יפסיק לשלוח אירועים, אבל יישאר ברשימה.`,
    );
    if (isConfirmed) {
      setRevokedDevice(device.id);
    }
  };

  const handleDeleteDevice = (device: Device) => {
    const isConfirmed = window.confirm(
      `למחוק את המכשיר "${device.name}"? האירועים שהוא שלח יישמרו בחדר.`,
    );
    if (isConfirmed) {
      removeDevice(device.id);
    }
  };

  return (
    <main className="admin-page">
      <header className="page-head">
        <h1>ניהול חדרים ומכשירים</h1>
      </header>
      {error && <p className="form-error">{error}</p>}

      <div className="admin-grid">
        <section className="glass panel">
          <h2>חדרים</h2>
          <RoomsList
            rooms={rooms}
            onEdit={setEditingRoom}
            onDelete={handleDeleteRoom}
          />
          <RoomForm
            key={editingRoom?.id ?? "new"}
            room={editingRoom}
            isLoading={isLoading}
            onSubmit={handleRoomSubmit}
            onCancel={() => setEditingRoom(null)}
          />
        </section>

        <section className="glass panel">
          <h2>מכשיר חדש</h2>
          <DeviceForm
            rooms={rooms}
            isLoading={isLoading}
            onSubmit={setNewDevice}
          />
          {newDeviceKey && (
            <DeviceKeyBox
              deviceKey={newDeviceKey}
              onHide={removeNewDeviceKey}
            />
          )}
        </section>

        <section className="glass panel wide">
          <h2>מכשירים</h2>
          <div className="table-scroll">
            <DevicesTable
              devices={devices}
              rooms={rooms}
              onRevoke={handleRevokeDevice}
              onDelete={handleDeleteDevice}
            />
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminPage;
