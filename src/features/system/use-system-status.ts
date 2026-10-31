import { useQuery } from "@tanstack/react-query";
import { statisticsQueryOptions } from "@/features/query-keys";

export function useSystemStatistics() {
	return useQuery(statisticsQueryOptions());
}
