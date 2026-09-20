import "./App.css";


function App() {
 return (
   <div className="login-page">
     <div className="login-card">


       <h1>Welcome Back</h1>
       <p className="subtitle">
         Sign in to view your fitness dashboard.
       </p>


       <form>
         <label>Email</label>
         <input
           type="email"
           placeholder="Enter your email"
         />


         <label>Password</label>
         <input
           type="password"
           placeholder="Enter your password"
         />


         <button type="submit">
           Sign In
         </button>
       </form>


       <p className="signup">
         Don't have an account? <a href="/">Sign Up</a>
       </p>


     </div>
   </div>
 );
}


export default App;
