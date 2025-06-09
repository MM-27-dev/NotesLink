import React from "react";
import { signOut } from "firebase/auth";

import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
// import { useEffect } from "react";
// import { onAuthStateChanged } from "firebase/auth";
// import { useDispatch } from "react-redux";
// import { addUser, removeUser } from "../utils/userSlice";

import { auth } from "../utils/firebase";

const Header = () => {
  const navigate = useNavigate();
  // const dispatch = useDispatch();
  const user = useSelector((store) => store.user);
  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        // Sign-out successful.
        navigate("/");
      })
      // eslint-disable-next-line no-unused-vars
      .catch((error) => {
        // An error happened.
        navigate("/error");
      });
  };

  return (
    <div className=" px-8 py-2 bg-gradient-to-b from-black z-10 w-screen flex justify-between">
      <img className="w-25" src="/logo.png" alt="Logo Image" />
      {user && (
        <div className="flex items-center gap-2">
          <img className="w-10 h-10 rounded-full" alt="usericon" src={user.photoURL} />
          <button onClick={handleSignOut} className="font-bold text-white">
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
