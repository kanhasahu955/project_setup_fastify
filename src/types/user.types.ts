import type { User, UserRole } from "../../generated/prisma/client";
import type { ListOptions } from "./common.types";

export interface CreateUserInput {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role?: UserRole;
    avatar?: string;
}

export interface UpdateUserInput {
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    role?: UserRole;
}

export interface UpdateProfileInput {
    bio?: string;
    companyName?: string;
    designation?: string;
    experienceYears?: number;
    reraNumber?: string;
    gstNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    website?: string;
    facebookUrl?: string;
    linkedinUrl?: string;
}

export interface UserListOptions extends ListOptions {
    role?: UserRole;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    isBlocked?: boolean;
    sortBy?: keyof User;
}

export type SafeUser = Omit<User, "password">;

export interface UserStats {
    total: number;
    verified: number;
    blocked: number;
    byRole: Record<UserRole, number>;
}

export interface UserRelationsOptions {
    profile?: boolean;
    listings?: boolean;
    subscriptions?: boolean;
    projects?: boolean;
}
