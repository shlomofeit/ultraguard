import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <main>
      <h1>UltraGuard</h1>
      <p>שומר אולטרסוני</p>
      <Link to="/beacons">מחולל ביקונים</Link>
    </main>
  );
};

export default HomePage;
