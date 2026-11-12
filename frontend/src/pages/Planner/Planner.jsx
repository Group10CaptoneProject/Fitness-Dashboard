import MainNav from "../../component/MainNavBar/MainNav";

function Planner() {
  const username = localStorage.getItem("username") || "Username";

  return (
    <>
      <MainNav username={username} />
    </>
  );
}

export default Planner;
