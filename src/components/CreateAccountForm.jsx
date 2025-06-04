import React, { useState, useRef } from "react";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { checkValidData } from "../utils/validate";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../utils/firebase";
import { useNavigate } from "react-router-dom";
import { USER_AVATAR } from "../utils/constant";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";


const CreateAccountForm = () => {
  const name = useRef(null);
  const email = useRef(null);
  const password = useRef(null);
  const confirmPassword = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const navigate = useNavigate()
  const dispatch = useDispatch();

  const handleCreateAccount = () => {
    const enteredName = name.current.value;
    const enteredEmail = email.current.value;
    const enteredPassword = password.current.value;

    const validationMessage = checkValidData(
      enteredName,
      enteredEmail,
      enteredPassword
    );
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("Please agree to the Terms of Service.");
      return;
    }

    createUserWithEmailAndPassword(auth, enteredEmail, enteredPassword)
      .then(async (userCredential) => {
        try {
          const user = userCredential.user;

          await updateProfile(user, {
            displayName: enteredName,
            photoURL: USER_AVATAR,
          });

          const {
            uid,
            email: userEmail,
            displayName,
            photoURL,
          } = auth.currentUser;

          dispatch(
            addUser({
              uid: uid,
              email: userEmail,
              displayName: displayName,
              photoURL: photoURL,
            })
          );
          navigate("/aichat"); 
        } catch (error) {
          setErrorMessage(error.message);
        }
      })
      .catch((error) => {
        setErrorMessage(`${error.code} - ${error.message}`);
      })
  };

  const handleConfirmPasswordBlur = () => {
    const enteredPassword = password.current.value;
    const enteredConfirmPassword = confirmPassword.current.value;

    if (
      enteredPassword &&
      enteredConfirmPassword &&
      enteredPassword !== enteredConfirmPassword
    ) {
      setErrorMessage("Passwords do not match.");
    } else {
      setErrorMessage(null);
    }
  };

  const handleSignInClick = () => {
    navigate("/");
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-800 to-purple-950 flex items-center justify-center px-4">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="bg-[#0f0f1b] p-6 rounded-2xl shadow-lg w-full max-w-sm text-white text-sm"
      >
        <div className="flex flex-col items-center mb-5">
          <div className="bg-gradient-to-br from-pink-500 to-purple-500 p-3 rounded-full mb-2">
            <User className="text-white" size={20} />
          </div>
          <h2 className="text-xl font-semibold">Create Account</h2>
          <p className="text-xs text-gray-400">Join us today</p>
        </div>

        {/* Full name */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Full name"
            ref={name}
            className="w-full py-2 pl-10 pr-4 bg-[#1e1e2e] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>

        {/* Email */}
        <div className="relative mb-3">
          <input
            type="email"
            placeholder="Email address"
            ref={email}
            className="w-full py-2 pl-10 pr-4 bg-[#1e1e2e] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>

        {/* Password */}
        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            ref={password}
            className="w-full py-2 pl-10 pr-10 bg-[#1e1e2e] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-2.5 text-gray-400"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="relative mb-3">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm password"
            ref={confirmPassword}
            onBlur={handleConfirmPasswordBlur}
            className="w-full py-2 pl-10 pr-10 bg-[#1e1e2e] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-2.5 text-gray-400"
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Terms checkbox */}
        <div className="flex items-start mb-3 text-xs">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mr-2 mt-1"
          />
          <label className="text-gray-400">
            I agree to the{" "}
            <span className="text-purple-400 hover:underline cursor-pointer">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="text-purple-400 hover:underline cursor-pointer">
              Privacy Policy
            </span>
          </label>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <p className="text-red-500 text-xs mb-3 text-center">
            {errorMessage}
          </p>
        )}

        {/* Create Account button */}
        <button
          type="submit"
          onClick={handleCreateAccount}
          className="w-full py-2 rounded-md font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition"
        >
          Create Account
        </button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <hr className="flex-grow border-gray-700" />
          <span className="px-2 text-xs text-gray-500">Or continue with</span>
          <hr className="flex-grow border-gray-700" />
        </div>

        {/* Google button */}
        <button className="w-full flex items-center justify-center py-2 border border-gray-700 rounded-md hover:bg-[#1a1a2e] transition text-white text-sm font-medium">
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-4 h-4 mr-2"
          />
          Continue with Google
        </button>

        {/* Bottom link */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account?{" "}
          <span
            className="text-purple-400 hover:underline cursor-pointer "
            onClick={handleSignInClick}
          >
            Sign in
          </span>
        </p>
      </form>
    </div>
  );
};

export default CreateAccountForm;
