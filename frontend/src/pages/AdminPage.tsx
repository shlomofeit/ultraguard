import { useEffect, useState } from "react";
import { useAdminStore } from "../store/adminStore";
import { useAuthStore } from "../store/authStore";
import type { Room, RoomInput } from "../types/room";
import type { Device, DeviceInput } from "../types/device";
import type { ManagedUser, ManagedUserInput } from "../types/user";
import RoomForm from "../components/RoomForm";
import RoomsTable from "../components/RoomsTable";
import DeviceForm from "../components/DeviceForm";
import DeviceKeyBox from "../components/DeviceKeyBox";
import DevicesTable from "../components/DevicesTable";
import UserForm from "../components/UserForm";
import UsersTable from "../components/UsersTable";
import ConfirmDialog from "../components/ConfirmDialog";

type AdminTab = "rooms" | "devices" | "users";

interface PendingConfirm {
  title: string;
  text: string;
  confirmText: string;
  action: () => void;
}

const AdminPage = () => {
  const rooms = useAdminStore((state) => state.rooms);
  const devices = useAdminStore((state) => state.devices);
  const users = useAdminStore((state) => state.users);
  const newDeviceKey = useAdminStore((state) => state.newDeviceKey);
  const isLoading = useAdminStore((state) => state.isLoading);
  const error = useAdminStore((state) => state.error);
  const setAdminData = useAdminStore((state) => state.setAdminData);
  const setNewRoom = useAdminStore((state) => state.setNewRoom);
  const setEditedRoom = useAdminStore((state) => state.setEditedRoom);
  const removeRoom = useAdminStore((state) => state.removeRoom);
  const setNewDevice = useAdminStore((state) => state.setNewDevice);
  const setEditedDevice = useAdminStore((state) => state.setEditedDevice);
  const setRevokedDevice = useAdminStore((state) => state.setRevokedDevice);
  const removeDevice = useAdminStore((state) => state.removeDevice);
  const removeNewDeviceKey = useAdminStore((state) => state.removeNewDeviceKey);
  const setEditedUser = useAdminStore((state) => state.setEditedUser);
  const removeUser = useAdminStore((state) => state.removeUser);
  const currentUser = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<AdminTab>("rooms");
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null,
  );

  useEffect(() => {
    setAdminData();
    return () => removeNewDeviceKey();
  }, [setAdminData, removeNewDeviceKey]);

  const tabs: { id: AdminTab; label: string; count: number }[] = [
    { id: "rooms", label: "חדרים", count: rooms.length },
    { id: "devices", label: "מכשירים", count: devices.length },
    { id: "users", label: "משתמשים", count: users.length },
  ];

  const handleRoomSubmit = (input: RoomInput) => {
    if (editingRoom) {
      setEditedRoom(editingRoom.id, input);
      setEditingRoom(null);
    } else {
      setNewRoom(input);
    }
  };

  const handleDeviceSubmit = (input: DeviceInput) => {
    if (editingDevice) {
      setEditedDevice(editingDevice.id, input);
      setEditingDevice(null);
    } else {
      setNewDevice(input);
    }
  };

  const handleUserSubmit = (input: ManagedUserInput) => {
    if (editingUser) {
      setEditedUser(editingUser.id, input);
      setEditingUser(null);
    }
  };

  const handleDeleteRoom = (room: Room) => {
    const devicesCount = devices.filter(
      (device) => device.roomId === room.id,
    ).length;
    setPendingConfirm({
      title: `למחוק את החדר "${room.name}"?`,
      text: `יימחקו גם ${devicesCount} המכשירים שלו וכל האירועים שנקלטו בו. אי אפשר לבטל את זה.`,
      confirmText: "מחק חדר",
      action: () => {
        removeRoom(room.id);
        setEditingRoom(null);
      },
    });
  };

  const handleRevokeDevice = (device: Device) => {
    setPendingConfirm({
      title: `לבטל את המפתח של "${device.name}"?`,
      text: "המכשיר יפסיק לשלוח אירועים, אבל יישאר ברשימה. אי אפשר להחזיר את המפתח.",
      confirmText: "בטל מפתח",
      action: () => setRevokedDevice(device.id),
    });
  };

  const handleDeleteDevice = (device: Device) => {
    setPendingConfirm({
      title: `למחוק את המכשיר "${device.name}"?`,
      text: "האירועים שהוא שלח יישמרו בחדר. אי אפשר לבטל את זה.",
      confirmText: "מחק מכשיר",
      action: () => {
        removeDevice(device.id);
        setEditingDevice(null);
      },
    });
  };

  const handleDeleteUser = (user: ManagedUser) => {
    setPendingConfirm({
      title: `למחוק את המשתמש "${user.name}"?`,
      text: "הוא לא יוכל להיכנס יותר. האירועים לא נמחקים. אי אפשר לבטל את זה.",
      confirmText: "מחק משתמש",
      action: () => {
        removeUser(user.id);
        setEditingUser(null);
      },
    });
  };

  const handleConfirm = () => {
    pendingConfirm?.action();
    setPendingConfirm(null);
  };

  return (
    <main className="admin-page">
      <header className="page-head">
        <h1>ניהול</h1>
      </header>
      {error && <p className="form-error">{error}</p>}

      <div className="tabs" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            <span className="count">{item.count}</span>
          </button>
        ))}
      </div>

      {tab === "rooms" && (
        <div className="manage-grid">
          <section className="glass panel">
            <div className="table-scroll">
              <RoomsTable
                rooms={rooms}
                devices={devices}
                users={users}
                editingId={editingRoom?.id ?? null}
                onEdit={setEditingRoom}
                onDelete={handleDeleteRoom}
              />
            </div>
          </section>
          <section className="glass panel">
            <h2>{editingRoom ? "עריכת חדר" : "חדר חדש"}</h2>
            <RoomForm
              key={editingRoom?.id ?? "new"}
              room={editingRoom}
              isLoading={isLoading}
              onSubmit={handleRoomSubmit}
              onCancel={() => setEditingRoom(null)}
            />
          </section>
        </div>
      )}

      {tab === "devices" && (
        <div className="manage-grid">
          <section className="glass panel">
            <div className="table-scroll">
              <DevicesTable
                devices={devices}
                rooms={rooms}
                editingId={editingDevice?.id ?? null}
                onEdit={setEditingDevice}
                onRevoke={handleRevokeDevice}
                onDelete={handleDeleteDevice}
              />
            </div>
          </section>
          <section className="glass panel">
            <h2>{editingDevice ? "עריכת מכשיר" : "מכשיר חדש"}</h2>
            <DeviceForm
              key={editingDevice?.id ?? "new"}
              device={editingDevice}
              rooms={rooms}
              isLoading={isLoading}
              onSubmit={handleDeviceSubmit}
              onCancel={() => setEditingDevice(null)}
            />
            {newDeviceKey && (
              <DeviceKeyBox
                deviceKey={newDeviceKey}
                onHide={removeNewDeviceKey}
              />
            )}
          </section>
        </div>
      )}

      {tab === "users" && (
        <div className="manage-grid">
          <section className="glass panel">
            <div className="table-scroll">
              <UsersTable
                users={users}
                rooms={rooms}
                currentUserId={currentUser?.id ?? ""}
                editingId={editingUser?.id ?? null}
                onEdit={setEditingUser}
                onDelete={handleDeleteUser}
              />
            </div>
          </section>
          <section className="glass panel">
            <h2>{editingUser ? "עריכת משתמש" : "משתמשים"}</h2>
            {editingUser ? (
              <UserForm
                key={editingUser.id}
                user={editingUser}
                rooms={rooms}
                isSelf={editingUser.id === currentUser?.id}
                isLoading={isLoading}
                onSubmit={handleUserSubmit}
                onCancel={() => setEditingUser(null)}
              />
            ) : (
              <p className="note">
                בוחרים משתמש בטבלה כדי לערוך אותו. משתמשים חדשים נרשמים בעצמם
                בדף ההרשמה, ומקבלים כאן תפקיד וחדרים.
              </p>
            )}
          </section>
        </div>
      )}

      {pendingConfirm && (
        <ConfirmDialog
          title={pendingConfirm.title}
          text={pendingConfirm.text}
          confirmText={pendingConfirm.confirmText}
          onConfirm={handleConfirm}
          onCancel={() => setPendingConfirm(null)}
        />
      )}
    </main>
  );
};

export default AdminPage;
