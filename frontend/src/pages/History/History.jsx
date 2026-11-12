import MainNav from "../../component/MainNavBar/MainNav";
function History() {
const username = localStorage.getItem("username") || "Username";
  return (
    <>
      <MainNav username={username} />
    </>
  );
}

export default History;