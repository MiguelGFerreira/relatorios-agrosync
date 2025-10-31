interface FiltersProps {
	filters: {
		os: number;
		ap: string;
	}
	
	onFilterChange: (newFilters: FiltersProps['filters']) => void;
	isLoading: boolean;
}

export default function Filters({ filters, onFilterChange, isLoading }: FiltersProps) {
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		onFilterChange({
			...filters,
			[name]: value,
		});
	};

	const clearFilters = () => {
		onFilterChange({
			os: 0,
			ap: '',
		})
	}

	return (
		<div className="bg-white p-4 rounded-lg shadow-sm mb-6 border">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
				{/* OS */}
				<div>
					<label htmlFor="os" className="block text-sm font-medium text-gray-700">OS</label>
					<input
						type="number"
						id="os"
						name="os"
						value={filters.os}
						onChange={handleInputChange}
						disabled={isLoading}
					/>
				</div>

				{/* AP */}
				<div>
					<label htmlFor="ap" className="block text-sm font-medium text-gray-700">AP</label>
					<input
						type="text"
						id="ap"
						name="ap"
						value={filters.ap}
						onChange={handleInputChange}
						disabled={isLoading}
					/>
				</div>

				{/* LIMPAR FILTRO */}
				<div className="flex justify-start">
					<button
						onClick={clearFilters}
						disabled={isLoading}
						className="bg-green-800 text-white font-semibold text-sm px-4 py-2 rounded-md hover:bg-green-600 cursor-pointer transition-all duration-300 disabled:bg-green-300"
					>
						Limpar Filtros
					</button>
				</div>
			</div>
		</div>
	)
}