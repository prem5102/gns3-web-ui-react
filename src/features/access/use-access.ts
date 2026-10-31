import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accessKeys, rolesQueryOptions, usersQueryOptions } from "@/features/query-keys";
import { gns3Api } from "@/lib/gns3-api";

export function useUsers() {
	return useQuery(usersQueryOptions());
}

export function useRoles() {
	return useQuery(rolesQueryOptions());
}

export function useCreateUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: {
			username: string;
			password?: string;
			email?: string;
			full_name?: string;
			is_active?: boolean;
			is_superadmin?: boolean;
		}) => gns3Api.createUser(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: accessKeys.users });
		},
	});
}

export function useDeleteUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userId: string) => gns3Api.deleteUser(userId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: accessKeys.users });
		},
	});
}
