import { useEffect } from "react";
import { useAdminStore } from "../store/adminStore";
import RoomForm from "../components/RoomForm";
import DeviceForm from "../components/DeviceForm";
import DevicesTable from "../components/DevicesTable";

const AdminPage = () => {
  const rooms = useAdminStore((state) => state.rooms);
  const devices = useAdminStore((state) => state.devices);
  const newDeviceKey = useAdminStore((state) => state.newDeviceKey);
  const isLoading = useAdminStore((state) => state.isLoading);
  const error = useAdminStore((state) => state.error);
  const setAdminData = useAdminStore((state) => state.setAdminData);
  const setNewRoom = useAdminStore((state) => state.setNewRoom);
  const setNewDevice = useAdminStore((state) => state.setNewDevice);
  const removeDevice = useAdminStore((state) => state.removeDevice);
  const removeNewDeviceKey = useAdminStore((state) => state.removeNewDeviceKey);

  useEffect(() => {
    setAdminData();
    return () => removeNewDeviceKey();
  }, [setAdminData, removeNewDeviceKey]);

  return (
    <main className="admin-page">
      <h1>ניהול חדרים ומכשירים</h1>
      {error && <p className="form-error">{error}</p>}

      <section>
        <h2>חדרים</h2>
        <ul>
          {rooms.map((room) => (
            <li key={room.id}>{room.name}</li>
          ))}
        </ul>
        <RoomForm isLoading={isLoading} onSubmit={setNewRoom} />
      </section>

      <section>
        <h2>מכשיר חדש</h2>
        <DeviceForm
          rooms={rooms}
          isLoading={isLoading}
          onSubmit={setNewDevice}
        />
        {newDeviceKey && (
          <div className="device-key">
            <p>
              זה מפתח המכשיר. הוא מוצג רק עכשיו. מעתיקים אותו לדף ההאזנה במכשיר:
            </p>
            <code dir="ltr">{newDeviceKey}</code>
            <button onClick={removeNewDeviceKey}>העתקתי, הסתר</button>
          </div>
        )}
      </section>

      <section>
        <h2>מכשירים</h2>
        <DevicesTable devices={devices} rooms={rooms} onRevoke={removeDevice} />
      </section>
    </main>
  );
};

export default AdminPage;
