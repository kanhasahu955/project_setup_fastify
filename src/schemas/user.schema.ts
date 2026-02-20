import {
    type ObjectSchema,
    IdParam,
    PaginationQuery,
    ErrorResponses,
    successResponse,
    createdResponse,
    paginatedResponse,
    buildSchema,
} from "./common.schema";

// ============================================
// ENUMS
// ============================================

export const UserRoleEnum = ["BUYER", "OWNER", "AGENT", "BUILDER", "ADMIN"] as const;

// ============================================
// MODEL SCHEMAS
// ============================================

export const PlanTypeEnum = ["FREE", "AGENT_BASIC", "AGENT_PRO", "BUILDER_PRO"] as const;
export const KycStatusEnum = ["PENDING", "SUBMITTED", "UNDER_REVIEW", "VERIFIED", "REJECTED"] as const;

export const KycDetailsSchema: ObjectSchema = {
    type: "object",
    properties: {
        aadharNumber: { type: "string", nullable: true, description: "Masked Aadhar number (last 4 digits)" },
        aadharName: { type: "string", nullable: true },
        aadharDob: { type: "string", nullable: true },
        aadharDocUrl: { type: "string", format: "uri", nullable: true },
        isAadharVerified: { type: "boolean", example: false },
        aadharVerifiedAt: { type: "string", format: "date-time", nullable: true },
        panNumber: { type: "string", nullable: true, description: "PAN number" },
        panName: { type: "string", nullable: true },
        panDocUrl: { type: "string", format: "uri", nullable: true },
        isPanVerified: { type: "boolean", example: false },
        panVerifiedAt: { type: "string", format: "date-time", nullable: true },
        kycStatus: { type: "string", enum: [...KycStatusEnum], example: "PENDING" },
        kycRemarks: { type: "string", nullable: true },
        kycVerifiedAt: { type: "string", format: "date-time", nullable: true },
    },
};

export const ProfileSchema: ObjectSchema = {
    type: "object",
    properties: {
        id: { type: "string", example: "507f1f77bcf86cd799439012" },
        userId: { type: "string", example: "507f1f77bcf86cd799439011" },
        bio: { type: "string", nullable: true },
        companyName: { type: "string", nullable: true },
        designation: { type: "string", nullable: true },
        experienceYears: { type: "integer", nullable: true },
        reraNumber: { type: "string", nullable: true },
        gstNumber: { type: "string", nullable: true },
        address: { type: "string", nullable: true },
        city: { type: "string", nullable: true },
        state: { type: "string", nullable: true },
        pincode: { type: "string", nullable: true },
        website: { type: "string", format: "uri", nullable: true },
        facebookUrl: { type: "string", format: "uri", nullable: true },
        linkedinUrl: { type: "string", format: "uri", nullable: true },
        isReraVerified: { type: "boolean", example: false },
        isCompanyVerified: { type: "boolean", example: false },
        rating: { type: "number", example: 4.5 },
        totalReviews: { type: "integer", example: 10 },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
    },
};

export const SubscriptionSchema: ObjectSchema = {
    type: "object",
    properties: {
        id: { type: "string", example: "507f1f77bcf86cd799439013" },
        userId: { type: "string", example: "507f1f77bcf86cd799439011" },
        plan: { type: "string", enum: [...PlanTypeEnum], example: "FREE" },
        expiry: { type: "string", format: "date-time" },
        active: { type: "boolean", example: true },
    },
};

export const UserSchema: ObjectSchema = {
    type: "object",
    properties: {
        id: { type: "string", example: "507f1f77bcf86cd799439011" },
        name: { type: "string", example: "John Doe" },
        email: { type: "string", format: "email", example: "john@example.com" },
        phone: { type: "string", example: "9876543210" },
        role: { type: "string", enum: [...UserRoleEnum], example: "BUYER" },
        isEmailVerified: { type: "boolean", example: true },
        isPhoneVerified: { type: "boolean", example: false },
        isBlocked: { type: "boolean", example: false },
        avatar: { type: "string", format: "uri", nullable: true },
        lastLogin: { type: "string", format: "date-time", nullable: true },
        kyc: KycDetailsSchema as any,
        profile: ProfileSchema as any,
        subscriptions: { type: "array", items: SubscriptionSchema as any },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
    },
};

export const UserStatsSchema: ObjectSchema = {
    type: "object",
    properties: {
        total: { type: "integer", example: 1000 },
        verified: { type: "integer", example: 800 },
        blocked: { type: "integer", example: 50 },
        byRole: {
            type: "object",
            properties: {
                BUYER: { type: "integer", example: 500 },
                OWNER: { type: "integer", example: 200 },
                AGENT: { type: "integer", example: 150 },
                BUILDER: { type: "integer", example: 100 },
                ADMIN: { type: "integer", example: 50 },
            },
        },
    },
};

// ============================================
// REQUEST BODY SCHEMAS
// ============================================

export const RegisterBody: ObjectSchema = {
    type: "object",
    required: ["name", "email", "phone", "password"],
    properties: {
        name: { type: "string", minLength: 2, maxLength: 100, description: "Full name" },
        email: { type: "string", format: "email", description: "Email address" },
        phone: { type: "string", minLength: 10, maxLength: 10, description: "10-digit Indian mobile number" },
        password: { type: "string", minLength: 8, description: "Password (min 8 chars, must include uppercase, lowercase, number, special char)" },
    },
};

export const VerifyOtpBody: ObjectSchema = {
    type: "object",
    required: ["email", "otp"],
    properties: {
        email: { type: "string", format: "email", description: "Email address" },
        otp: { type: "string", minLength: 6, maxLength: 6, description: "6-digit OTP" },
    },
};

export const ResendOtpBody: ObjectSchema = {
    type: "object",
    required: ["email"],
    properties: {
        email: { type: "string", format: "email", description: "Email address" },
    },
};

export const CreateUserBody: ObjectSchema = {
    type: "object",
    required: ["name", "email", "phone"],
    properties: {
        name: { type: "string", minLength: 2, maxLength: 100, description: "Full name" },
        email: { type: "string", format: "email", description: "Email address" },
        phone: { type: "string", minLength: 10, maxLength: 15, description: "Phone number" },
        password: { type: "string", minLength: 6, description: "Password (optional for OAuth)" },
        role: { type: "string", enum: [...UserRoleEnum], default: "BUYER", description: "User role" },
        avatar: { type: "string", format: "uri", description: "Profile picture URL" },
    },
};

export const UpdateUserBody: ObjectSchema = {
    type: "object",
    properties: {
        name: { type: "string", minLength: 2, maxLength: 100, description: "Full name" },
        email: { type: "string", format: "email", description: "Email address" },
        phone: { type: "string", minLength: 10, maxLength: 15, description: "Phone number" },
        avatar: { type: "string", format: "uri", description: "Profile picture URL" },
        role: { type: "string", enum: [...UserRoleEnum], description: "User role" },
    },
};

export const LoginBody: ObjectSchema = {
    type: "object",
    required: ["identifier", "password"],
    properties: {
        identifier: { type: "string", description: "Email or 10-digit phone number" },
        password: { type: "string", minLength: 1, description: "Account password" },
    },
};

export const UpdatePasswordBody: ObjectSchema = {
    type: "object",
    required: ["currentPassword", "newPassword"],
    properties: {
        currentPassword: { type: "string", minLength: 1, description: "Current password" },
        newPassword: { type: "string", minLength: 6, description: "New password" },
    },
};

export const UpdateRoleBody: ObjectSchema = {
    type: "object",
    required: ["role"],
    properties: {
        role: { type: "string", enum: [...UserRoleEnum], description: "New user role" },
    },
};

export const SubmitAadharKycBody: ObjectSchema = {
    type: "object",
    required: ["aadharNumber", "aadharName", "aadharDob"],
    properties: {
        aadharNumber: { type: "string", minLength: 12, maxLength: 12, description: "12-digit Aadhar number" },
        aadharName: { type: "string", minLength: 2, maxLength: 100, description: "Name as on Aadhar" },
        aadharDob: { type: "string", description: "Date of birth (DD-MM-YYYY)" },
        aadharDocUrl: { type: "string", format: "uri", description: "Aadhar document image URL" },
    },
};

export const SubmitPanKycBody: ObjectSchema = {
    type: "object",
    required: ["panNumber", "panName"],
    properties: {
        panNumber: { type: "string", minLength: 10, maxLength: 10, description: "10-character PAN number" },
        panName: { type: "string", minLength: 2, maxLength: 100, description: "Name as on PAN" },
        panDocUrl: { type: "string", format: "uri", description: "PAN document image URL" },
    },
};

export const VerifyKycBody: ObjectSchema = {
    type: "object",
    required: ["kycStatus"],
    properties: {
        kycStatus: { type: "string", enum: [...KycStatusEnum], description: "KYC verification status" },
        kycRemarks: { type: "string", maxLength: 500, description: "Remarks for rejection or approval" },
        verifyAadhar: { type: "boolean", description: "Verify Aadhar" },
        verifyPan: { type: "boolean", description: "Verify PAN" },
    },
};

export const UpdateProfileBody: ObjectSchema = {
    type: "object",
    properties: {
        bio: { type: "string", maxLength: 500, description: "Short biography" },
        companyName: { type: "string", maxLength: 100, description: "Company name" },
        designation: { type: "string", maxLength: 50, description: "Job title" },
        experienceYears: { type: "integer", minimum: 0, maximum: 50, description: "Years of experience" },
        reraNumber: { type: "string", description: "RERA registration number" },
        gstNumber: { type: "string", description: "GST number" },
        address: { type: "string", maxLength: 200, description: "Office address" },
        city: { type: "string", maxLength: 50, description: "City" },
        state: { type: "string", maxLength: 50, description: "State" },
        pincode: { type: "string", maxLength: 10, description: "PIN code" },
        website: { type: "string", format: "uri", description: "Website URL" },
        facebookUrl: { type: "string", format: "uri", description: "Facebook profile" },
        linkedinUrl: { type: "string", format: "uri", description: "LinkedIn profile" },
    },
};

// ============================================
// QUERY SCHEMAS
// ============================================

export const UserListQuery: ObjectSchema = {
    type: "object",
    properties: {
        ...PaginationQuery.properties,
        search: { type: "string", description: "Search by name, email, or phone" },
        role: { type: "string", enum: [...UserRoleEnum], description: "Filter by role" },
        isEmailVerified: { type: "boolean", description: "Filter by email verification status" },
        isPhoneVerified: { type: "boolean", description: "Filter by phone verification status" },
        isBlocked: { type: "boolean", description: "Filter by blocked status" },
        sortBy: { type: "string", default: "createdAt", description: "Field to sort by" },
    },
};

export const ExistsQuery: ObjectSchema = {
    type: "object",
    properties: {
        email: { type: "string", format: "email", description: "Email to check" },
        phone: { type: "string", description: "Phone to check" },
    },
};

// ============================================
// ROUTE SCHEMAS
// ============================================

export const UserRouteSchemas = {
    register: buildSchema({
        description: "Register a new user account",
        tags: ["Auth"],
        body: CreateUserBody,
        response: {
            201: createdResponse(UserSchema, "User registered successfully"),
            400: ErrorResponses.ValidationError,
            409: ErrorResponses.Conflict,
        },
    }),

    login: buildSchema({
        description: "Login with email/phone and password",
        tags: ["Auth"],
        body: LoginBody,
        response: {
            200: successResponse(UserSchema, "Login successful"),
            400: ErrorResponses.ValidationError,
            401: ErrorResponses.Unauthorized,
            403: ErrorResponses.Forbidden,
        },
    }),

    getMe: buildSchema({
        description: "Get current authenticated user profile",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        response: {
            200: successResponse(UserSchema, "Profile retrieved successfully"),
            401: ErrorResponses.Unauthorized,
        },
    }),

    list: buildSchema({
        description: "List users with pagination and filters",
        tags: ["Users"],
        querystring: UserListQuery,
        response: {
            200: paginatedResponse(UserSchema, "Users retrieved successfully"),
            400: ErrorResponses.ValidationError,
        },
    }),

    getById: buildSchema({
        description: "Get user by ID",
        tags: ["Users"],
        params: IdParam,
        querystring: {
            type: "object",
            properties: {
                includeProfile: { type: "boolean", default: false, description: "Include profile data" },
            },
        },
        response: {
            200: successResponse(UserSchema, "User retrieved successfully"),
            400: ErrorResponses.ValidationError,
            404: ErrorResponses.NotFound,
        },
    }),

    update: buildSchema({
        description: "Update user details",
        tags: ["Users"],
        params: IdParam,
        body: UpdateUserBody,
        response: {
            200: successResponse(UserSchema, "User updated successfully"),
            400: ErrorResponses.ValidationError,
            404: ErrorResponses.NotFound,
            409: ErrorResponses.Conflict,
        },
    }),

    delete: buildSchema({
        description: "Delete user by ID",
        tags: ["Users"],
        params: IdParam,
        response: {
            200: successResponse(undefined, "User deleted successfully"),
            404: ErrorResponses.NotFound,
        },
    }),

    updatePassword: buildSchema({
        description: "Update user password",
        tags: ["Users"],
        params: IdParam,
        body: UpdatePasswordBody,
        response: {
            200: successResponse(undefined, "Password updated successfully"),
            400: ErrorResponses.ValidationError,
            401: ErrorResponses.Unauthorized,
            404: ErrorResponses.NotFound,
        },
    }),

    block: buildSchema({
        description: "Block a user",
        tags: ["Users", "Admin"],
        params: IdParam,
        response: {
            200: successResponse(UserSchema, "User blocked successfully"),
            404: ErrorResponses.NotFound,
        },
    }),

    unblock: buildSchema({
        description: "Unblock a user",
        tags: ["Users", "Admin"],
        params: IdParam,
        response: {
            200: successResponse(UserSchema, "User unblocked successfully"),
            404: ErrorResponses.NotFound,
        },
    }),

    verify: buildSchema({
        description: "Verify a user",
        tags: ["Users", "Admin"],
        params: IdParam,
        response: {
            200: successResponse(UserSchema, "User verified successfully"),
            404: ErrorResponses.NotFound,
        },
    }),

    updateRole: buildSchema({
        description: "Update user role",
        tags: ["Users", "Admin"],
        params: IdParam,
        body: UpdateRoleBody,
        response: {
            200: successResponse(UserSchema, "User role updated successfully"),
            400: ErrorResponses.ValidationError,
            404: ErrorResponses.NotFound,
        },
    }),

    getProfile: buildSchema({
        description: "Get user profile",
        tags: ["Users", "Profile"],
        params: IdParam,
        response: {
            200: successResponse(ProfileSchema, "Profile retrieved successfully"),
            404: ErrorResponses.NotFound,
        },
    }),

    upsertProfile: buildSchema({
        description: "Create or update user profile",
        tags: ["Users", "Profile"],
        params: IdParam,
        body: UpdateProfileBody,
        response: {
            200: successResponse(ProfileSchema, "Profile updated successfully"),
            400: ErrorResponses.ValidationError,
            404: ErrorResponses.NotFound,
        },
    }),

    getStats: buildSchema({
        description: "Get user statistics grouped by role",
        tags: ["Users"],
        response: {
            200: successResponse(UserStatsSchema, "User statistics retrieved successfully"),
        },
    }),

    checkExists: buildSchema({
        description: "Check if user exists by email or phone",
        tags: ["Users"],
        querystring: ExistsQuery,
        response: {
            200: successResponse({
                type: "object",
                properties: {
                    exists: { type: "boolean" },
                },
            }, "Check completed"),
            400: ErrorResponses.ValidationError,
        },
    }),

    // KYC Routes
    submitAadharKyc: buildSchema({
        description: "Submit Aadhar card details for KYC verification",
        tags: ["Users", "KYC"],
        params: IdParam,
        body: SubmitAadharKycBody,
        response: {
            200: successResponse(KycDetailsSchema, "Aadhar details submitted successfully"),
            400: ErrorResponses.ValidationError,
            404: ErrorResponses.NotFound,
        },
    }),

    submitPanKyc: buildSchema({
        description: "Submit PAN card details for KYC verification",
        tags: ["Users", "KYC"],
        params: IdParam,
        body: SubmitPanKycBody,
        response: {
            200: successResponse(KycDetailsSchema, "PAN details submitted successfully"),
            400: ErrorResponses.ValidationError,
            404: ErrorResponses.NotFound,
        },
    }),

    getKycStatus: buildSchema({
        description: "Get user KYC status and details",
        tags: ["Users", "KYC"],
        params: IdParam,
        response: {
            200: successResponse(KycDetailsSchema, "KYC details retrieved"),
            404: ErrorResponses.NotFound,
        },
    }),

    verifyKyc: buildSchema({
        description: "Admin: Verify or reject user KYC",
        tags: ["Users", "KYC", "Admin"],
        params: IdParam,
        body: VerifyKycBody,
        response: {
            200: successResponse(KycDetailsSchema, "KYC status updated"),
            400: ErrorResponses.ValidationError,
            404: ErrorResponses.NotFound,
        },
    }),
};

// ============================================
// AUTH ROUTE SCHEMAS (with OTP verification)
// ============================================

const AuthResponseSchema: ObjectSchema = {
    type: "object",
    properties: {
        message: { type: "string" },
        email: { type: "string", format: "email" },
    },
};

const LoginResponseSchema: ObjectSchema = {
    type: "object",
    properties: {
        user: UserSchema as any,
        token: { type: "string", description: "JWT token" },
    },
};

const ValidationErrorSchema: ObjectSchema = {
    type: "object",
    properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Validation failed" },
        statusCode: { type: "integer", example: 400 },
        errors: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    field: { type: "string", example: "email" },
                    message: { type: "string", example: "Invalid email format" },
                },
            },
        },
    },
};

export const AuthRouteSchemas = {
    register: buildSchema({
        description: "Register a new user. Sends OTP to email for verification.",
        tags: ["Auth"],
        body: RegisterBody,
        response: {
            200: successResponse(AuthResponseSchema, "OTP sent successfully"),
            400: ValidationErrorSchema,
            409: ErrorResponses.Conflict,
        },
    }),

    verifyOtp: buildSchema({
        description: "Verify OTP and complete registration",
        tags: ["Auth"],
        body: VerifyOtpBody,
        response: {
            201: createdResponse(LoginResponseSchema, "Registration completed successfully"),
            400: ValidationErrorSchema,
            404: ErrorResponses.NotFound,
        },
    }),

    resendOtp: buildSchema({
        description: "Resend OTP to email",
        tags: ["Auth"],
        body: ResendOtpBody,
        response: {
            200: successResponse(AuthResponseSchema, "OTP resent successfully"),
            400: ValidationErrorSchema,
            404: ErrorResponses.NotFound,
        },
    }),

    login: buildSchema({
        description: "Login with email/phone and password",
        tags: ["Auth"],
        body: LoginBody,
        response: {
            200: successResponse(LoginResponseSchema, "Login successful"),
            400: ValidationErrorSchema,
            401: ErrorResponses.Unauthorized,
            403: ErrorResponses.Forbidden,
        },
    }),
};
