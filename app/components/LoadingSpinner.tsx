import React from "react";
import Image from "next/image";
import tristao from '@/public/images/tristao_verde.png'
// import tristao from '@/public/images/tristao_verde_musgo.png';

const LoadingSpinner = () => {
	return (
		<div role="status" className="w-full flex justify-center">
			<Image
				src={tristao}
				alt={"loading_spinner"}
				width={60}
				height={60}
				className="animate-spin select-none"
				priority={true}
			/>
			<span className="sr-only">Loading...</span>
		</div>
	);
};

export default LoadingSpinner;