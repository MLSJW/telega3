import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const VerifyEmail = () => {
	const [searchParams] = useSearchParams();
	const [loading, setLoading] = useState(true);
	const [message, setMessage] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		const verify = async () => {
			const token = searchParams.get("token");
			if (!token) {
				setMessage("Invalid verification link");
				setLoading(false);
				return;
			}

			try {
				const res = await fetch(`/api/auth/verify?token=${token}`);
				const data = await res.json();
				if (data.error) {
					throw new Error(data.error);
				}
				setMessage(data.message + ". Redirecting to login...");
				toast.success(data.message);
				setTimeout(() => navigate("/login"), 2000);
			} catch (error) {
				setMessage(error.message);
				toast.error(error.message);
			} finally {
				setLoading(false);
			}
		};

		verify();
	}, [searchParams]);

	return (
		<div className='flex flex-col items-center justify-center min-w-96 mx-auto'>
			<div className='w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0'>
				<h1 className='text-3xl font-semibold text-center text-gray-300'>
					Email Verification
				</h1>
				{loading ? (
					<div className='text-center mt-4'>
						<span className='loading loading-spinner'></span>
						<p>Verifying...</p>
					</div>
				) : (
					<p className='text-center mt-4'>{message}</p>
				)}
			</div>
		</div>
	);
};

export default VerifyEmail;