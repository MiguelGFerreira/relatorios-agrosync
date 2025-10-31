"use client";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	totalRecords: number;
	onPageChange: (page: number) => void;
	isLoading: boolean;
	limit: number;
}

export default function Pagination({ currentPage, totalPages, totalRecords, onPageChange, isLoading, limit }: PaginationProps) {
	if (totalPages <= 1) return null;

	const from = (currentPage - 1) * limit + 1;
	const to = Math.min(currentPage * limit, totalRecords);

	return (
		<div className="flex flex-col sm:flex-row items-center justify-between m-4">
			<div className="text-sm text-gray-700 mb-2 sm:mb-0">
				Mostrando <span className="font-semibold">{from}</span> a <span className="font-semibold">{to}</span> de <span className="font-semibold">{totalRecords}</span> registros
			</div>

			<div className="flex items-center gap-2">
				<button
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1 || isLoading}
					className="button-pagination"
				>
					Anterior
				</button>

				<span className="text-sm text-gray-700">
					Página <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
				</span>

				<button
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages || isLoading}
					className="button-pagination"
				>
					Próxima
				</button>
			</div>
		</div>
	)
}