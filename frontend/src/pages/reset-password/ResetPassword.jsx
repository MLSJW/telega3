import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const ResetPassword = () => {
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token");
	const navigate = useNavigate();

	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (!token) {
			setError("Invalid reset link");
		}
	}, [token]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			setError("Passwords don't match");
			return;
		}
		setError("");
		setMessage("");
		setLoading(true);
		try {
			const res = await apiFetch("/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, newPassword }),
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			setMessage(data.message);
			setTimeout(() => navigate("/login"), 2000);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	if (!token) {
		return (
			<div className='flex flex-col items-center justify-center min-w-96 mx-auto'>
				<div className='w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0'>
					<h1 className='text-3xl font-semibold text-center text-gray-300'>Invalid Link</h1>
					<p className='text-center text-red-500'>The reset link is invalid or expired.</p>
				</div>
			</div>
		);
	}

	return (
		<div className='flex flex-col items-center justify-center min-w-96 mx-auto'>
			<div className='w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0'>
				<h1 className='text-3xl font-semibold text-center text-gray-300'>
					Reset Password
					<span className='text-blue-500'> curs-msngr</span>
				</h1>

				<form onSubmit={handleSubmit}>
					<div>
						<label className='label p-2'>
							<span className='text-base label-text'>New Password</span>
						</label>
						<input
							type='password'
							placeholder='Enter new password'
							className='w-full input input-bordered h-10'
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							required
						/>
					</div>

					<div>
						<label className='label'>
							<span className='text-base label-text'>Confirm Password</span>
						</label>
						<input
							type='password'
							placeholder='Confirm new password'
							className='w-full input input-bordered h-10'
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
						/>
					</div>

					<div>
						<button className='btn btn-block btn-sm mt-2' disabled={loading}>
							{loading ? <span className='loading loading-spinner '></span> : "Reset Password"}
						</button>
					</div>
				</form>

				{message && <div className="text-green-500 mt-2">{message}</div>}
				{error && <div className="text-red-500 mt-2">{error}</div>}
			</div>
		</div>
	);
};

export default ResetPassword;