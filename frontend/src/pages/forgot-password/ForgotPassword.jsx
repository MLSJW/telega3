import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const ForgotPassword = () => {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setMessage("");
		setLoading(true);
		try {
			const res = await apiFetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			setMessage(data.message);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

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
							<span className='text-base label-text'>Email</span>
						</label>
						<input
							type='email'
							placeholder='Enter your email'
							className='w-full input input-bordered h-10'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>

					<div>
						<button className='btn btn-block btn-sm mt-2' disabled={loading}>
							{loading ? <span className='loading loading-spinner '></span> : "Send Reset Link"}
						</button>
					</div>
				</form>

				{message && <div className="text-green-500 mt-2">{message}</div>}
				{error && <div className="text-red-500 mt-2">{error}</div>}

				<Link to='/login' className='text-sm hover:underline hover:text-blue-600 mt-2 inline-block'>
					Back to Login
				</Link>
			</div>
		</div>
	);
};

export default ForgotPassword;