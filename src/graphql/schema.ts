export const typeDefs = `
  # ============================================
  # ENUMS
  # ============================================
  
  enum UserRole {
    BUYER
    OWNER
    AGENT
    BUILDER
    ADMIN
  }

  enum KycStatus {
    PENDING
    SUBMITTED
    UNDER_REVIEW
    VERIFIED
    REJECTED
  }

  enum LeadSource {
    CHAT
    CALL
    AI_ASSISTANT
    DIRECT_ENQUIRY
  }

  enum LeadStatus {
    NEW
    CONTACTED
    SITE_VISIT
    CLOSED
    LOST
  }

  enum PlanType {
    FREE
    AGENT_BASIC
    AGENT_PRO
    BUILDER_PRO
  }

  enum ListingType {
    SALE
    RENT
    LEASE
  }

  enum PropertyCondition {
    NEW
    RESALE
    UNDER_CONSTRUCTION
    READY_TO_MOVE
  }

  enum PropertyType {
    APARTMENT
    INDEPENDENT_HOUSE
    VILLA
    STUDIO_APARTMENT
    PENTHOUSE
    BUILDER_FLOOR
    OFFICE_SPACE
    SHOP
    SHOWROOM
    WAREHOUSE
    INDUSTRIAL_BUILDING
    CO_WORKING
    RESIDENTIAL_PLOT
    COMMERCIAL_PLOT
    AGRICULTURAL_LAND
    PG
    HOSTEL
  }

  enum ListingStatus {
    DRAFT
    PENDING_APPROVAL
    ACTIVE
    UNDER_REVIEW
    SOLD
    RENTED
    EXPIRED
    REJECTED
    BLOCKED
    ARCHIVED
  }

  enum FurnishingType {
    UNFURNISHED
    SEMI_FURNISHED
    FULLY_FURNISHED
  }

  enum AmenityCategory {
    BASIC
    SECURITY
    LIFESTYLE
    SPORTS
    POWER_BACKUP
    WATER_SUPPLY
  }

  # ============================================
  # USER & AUTH TYPES
  # ============================================

  type KycDetails {
    aadharNumber: String
    aadharName: String
    aadharDob: String
    aadharDocUrl: String
    isAadharVerified: Boolean
    aadharVerifiedAt: String
    panNumber: String
    panName: String
    panDocUrl: String
    isPanVerified: Boolean
    panVerifiedAt: String
    kycStatus: KycStatus
    kycRemarks: String
    kycVerifiedAt: String
    kycVerifiedBy: String
  }

  type Profile {
    id: ID!
    userId: ID!
    bio: String
    companyName: String
    designation: String
    experienceYears: Int
    reraNumber: String
    gstNumber: String
    address: String
    city: String
    state: String
    pincode: String
    website: String
    facebookUrl: String
    linkedinUrl: String
    isReraVerified: Boolean
    isCompanyVerified: Boolean
    rating: Float
    totalReviews: Int
    createdAt: String
    updatedAt: String
  }

  type Subscription {
    id: ID!
    userId: ID!
    plan: PlanType!
    expiry: String!
    active: Boolean!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    phone: String!
    role: UserRole!
    isEmailVerified: Boolean!
    isPhoneVerified: Boolean!
    isBlocked: Boolean!
    avatar: String
    lastLogin: String
    kyc: KycDetails
    profile: Profile
    subscriptions: [Subscription]
    listings: [Listing]
    projects: [Project]
    leadsAsBuyer: [Lead]
    leadsAsOwner: [Lead]
    reviewsGiven: [Review]
    reviewsReceived: [Review]
    createdAt: String!
    updatedAt: String!
  }

  type AuthResponse {
    message: String!
    email: String
  }

  type LoginResponse {
    user: User!
    token: String!
  }

  # ============================================
  # PROJECT TYPES
  # ============================================

  type Project {
    id: ID!
    name: String!
    slug: String!
    description: String!
    city: String!
    locality: String!
    latitude: Float!
    longitude: Float!
    builderId: ID!
    builder: User
    totalUnits: Int
    possessionDate: String
    reraNumber: String
    listings: [Listing]
    createdAt: String!
  }

  # ============================================
  # LISTING TYPES
  # ============================================

  type ListingImage {
    id: ID!
    listingId: ID!
    url: String!
    isPrimary: Boolean!
    order: Int!
    createdAt: String
  }

  type Amenity {
    id: ID!
    name: String!
    icon: String
    category: AmenityCategory!
  }

  type AmenityOnListing {
    id: ID!
    listingId: ID!
    amenityId: ID!
    amenity: Amenity
    isHighlighted: Boolean!
    verified: Boolean!
    createdAt: String
  }

  type Listing {
    id: ID!
    title: String!
    slug: String!
    description: String!
    price: Float!
    pricePerSqft: Float
    listingType: ListingType!
    propertyType: PropertyType!
    condition: PropertyCondition
    status: ListingStatus!
    bedrooms: Int
    bathrooms: Int
    balconies: Int
    floor: Int
    totalFloors: Int
    area: Float
    carpetArea: Float
    builtUpArea: Float
    furnishing: FurnishingType
    facing: String
    city: String!
    locality: String!
    state: String!
    pincode: String
    latitude: Float!
    longitude: Float!
    isVerified: Boolean!
    isFeatured: Boolean!
    boostExpiry: String
    expiryDate: String
    deletedAt: String
    views: Int!
    clicks: Int!
    ownerId: ID!
    owner: User
    projectId: ID
    project: Project
    images: [ListingImage]
    amenities: [AmenityOnListing]
    leads: [Lead]
    createdAt: String!
    updatedAt: String!
  }

  # ============================================
  # LEAD TYPES
  # ============================================

  type Lead {
    id: ID!
    listingId: ID!
    buyerId: ID!
    ownerId: ID!
    message: String
    source: LeadSource!
    status: LeadStatus!
    listing: Listing
    buyer: User
    owner: User
    createdAt: String!
  }

  # ============================================
  # REVIEW TYPES
  # ============================================

  type Review {
    id: ID!
    rating: Int!
    comment: String
    reviewerId: ID!
    userId: ID!
    reviewer: User
    user: User
    createdAt: String!
  }

  # ============================================
  # HEALTH & SYSTEM TYPES
  # ============================================

  type HealthStatus {
    status: String!
    uptime: Float!
    timestamp: String!
    services: ServiceStatus
    memory: MemoryStatus
  }

  type ServiceStatus {
    database: String!
  }

  type MemoryStatus {
    used: String!
    total: String!
  }

  # ============================================
  # IMAGE & FILE TYPES
  # ============================================

  type ImageKitFile {
    fileId: String!
    name: String!
    url: String!
    thumbnailUrl: String
    filePath: String!
    fileType: String!
    size: Int
    width: Int
    height: Int
    createdAt: String
  }

  type ImageKitAuthParams {
    token: String!
    expire: Int!
    signature: String!
  }

  # ============================================
  # PAGINATION & COMMON TYPES
  # ============================================

  type Pagination {
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
    hasNext: Boolean!
    hasPrev: Boolean!
  }

  type UserListResponse {
    data: [User]!
    pagination: Pagination!
  }

  type ListingListResponse {
    data: [Listing]!
    pagination: Pagination!
  }

  type ProjectListResponse {
    data: [Project]!
    pagination: Pagination!
  }

  type LeadListResponse {
    data: [Lead]!
    pagination: Pagination!
  }

  type ReviewListResponse {
    data: [Review]!
    pagination: Pagination!
  }

  type UserStats {
    total: Int!
    verified: Int!
    blocked: Int!
    byRole: RoleStats
  }

  type RoleStats {
    BUYER: Int
    OWNER: Int
    AGENT: Int
    BUILDER: Int
    ADMIN: Int
  }

  type ListingStats {
    total: Int!
    active: Int!
    pending: Int!
    sold: Int!
    rented: Int!
  }

  type ExistsResponse {
    exists: Boolean!
  }

  type SuccessResponse {
    success: Boolean!
    message: String!
  }

  type DeleteResponse {
    success: Boolean!
    message: String!
    deletedCount: Int
  }

  # ============================================
  # INPUT TYPES - AUTH
  # ============================================

  input RegisterInput {
    name: String!
    email: String!
    phone: String!
    password: String!
  }

  input VerifyOtpInput {
    email: String!
    otp: String!
  }

  input ResendOtpInput {
    email: String!
  }

  input LoginInput {
    identifier: String!
    password: String!
  }

  # ============================================
  # INPUT TYPES - USER
  # ============================================

  input UpdateUserInput {
    name: String
    email: String
    phone: String
    avatar: String
    role: UserRole
  }

  input UpdateProfileInput {
    bio: String
    companyName: String
    designation: String
    experienceYears: Int
    reraNumber: String
    gstNumber: String
    address: String
    city: String
    state: String
    pincode: String
    website: String
    facebookUrl: String
    linkedinUrl: String
  }

  input UpdatePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  input SubmitAadharKycInput {
    aadharNumber: String!
    aadharName: String!
    aadharDob: String!
    aadharDocUrl: String
  }

  input SubmitPanKycInput {
    panNumber: String!
    panName: String!
    panDocUrl: String
  }

  input VerifyKycInput {
    kycStatus: KycStatus!
    kycRemarks: String
    verifyAadhar: Boolean
    verifyPan: Boolean
  }

  input UserListInput {
    page: Int
    limit: Int
    search: String
    role: UserRole
    isEmailVerified: Boolean
    isBlocked: Boolean
    sortBy: String
    sortOrder: String
  }

  # ============================================
  # INPUT TYPES - PROJECT
  # ============================================

  input CreateProjectInput {
    name: String!
    description: String!
    city: String!
    locality: String!
    latitude: Float!
    longitude: Float!
    totalUnits: Int
    possessionDate: String
    reraNumber: String
  }

  input UpdateProjectInput {
    name: String
    description: String
    city: String
    locality: String
    latitude: Float
    longitude: Float
    totalUnits: Int
    possessionDate: String
    reraNumber: String
  }

  input ProjectListInput {
    page: Int
    limit: Int
    search: String
    city: String
    builderId: ID
    sortBy: String
    sortOrder: String
  }

  # ============================================
  # INPUT TYPES - LISTING
  # ============================================

  input CreateListingInput {
    title: String!
    description: String!
    price: Float!
    pricePerSqft: Float
    listingType: ListingType!
    propertyType: PropertyType!
    condition: PropertyCondition
    bedrooms: Int
    bathrooms: Int
    balconies: Int
    floor: Int
    totalFloors: Int
    area: Float
    carpetArea: Float
    builtUpArea: Float
    furnishing: FurnishingType
    facing: String
    city: String!
    locality: String!
    state: String!
    pincode: String
    latitude: Float!
    longitude: Float!
    projectId: ID
    amenityIds: [ID]
    images: [ListingImageInput]
  }

  input UpdateListingInput {
    title: String
    description: String
    price: Float
    pricePerSqft: Float
    listingType: ListingType
    propertyType: PropertyType
    condition: PropertyCondition
    status: ListingStatus
    bedrooms: Int
    bathrooms: Int
    balconies: Int
    floor: Int
    totalFloors: Int
    area: Float
    carpetArea: Float
    builtUpArea: Float
    furnishing: FurnishingType
    facing: String
    city: String
    locality: String
    state: String
    pincode: String
    latitude: Float
    longitude: Float
    isFeatured: Boolean
  }

  input ListingImageInput {
    url: String!
    isPrimary: Boolean
    order: Int
  }

  input ListingListInput {
    page: Int
    limit: Int
    search: String
    city: String
    locality: String
    listingType: ListingType
    propertyType: PropertyType
    status: ListingStatus
    minPrice: Float
    maxPrice: Float
    bedrooms: Int
    ownerId: ID
    projectId: ID
    isFeatured: Boolean
    isVerified: Boolean
    sortBy: String
    sortOrder: String
  }

  # ============================================
  # INPUT TYPES - LEAD
  # ============================================

  input CreateLeadInput {
    listingId: ID!
    message: String
    source: LeadSource!
  }

  input UpdateLeadInput {
    status: LeadStatus!
  }

  input LeadListInput {
    page: Int
    limit: Int
    listingId: ID
    buyerId: ID
    ownerId: ID
    status: LeadStatus
    source: LeadSource
    sortBy: String
    sortOrder: String
  }

  # ============================================
  # INPUT TYPES - REVIEW
  # ============================================

  input CreateReviewInput {
    userId: ID!
    rating: Int!
    comment: String
  }

  input UpdateReviewInput {
    rating: Int
    comment: String
  }

  input ReviewListInput {
    page: Int
    limit: Int
    userId: ID
    reviewerId: ID
    minRating: Int
    sortBy: String
    sortOrder: String
  }

  # ============================================
  # INPUT TYPES - AMENITY
  # ============================================

  input CreateAmenityInput {
    name: String!
    icon: String
    category: AmenityCategory!
  }

  input UpdateAmenityInput {
    name: String
    icon: String
    category: AmenityCategory
  }

  # ============================================
  # INPUT TYPES - SUBSCRIPTION
  # ============================================

  input CreateSubscriptionInput {
    userId: ID!
    plan: PlanType!
    expiry: String!
  }

  # ============================================
  # QUERIES
  # ============================================

  type Query {
    # Health
    health(detailed: Boolean): HealthStatus!

    # User queries
    me: User
    user(id: ID!): User
    users(input: UserListInput): UserListResponse!
    userStats: UserStats!
    userExists(email: String, phone: String): ExistsResponse!
    
    # Profile queries
    profile(userId: ID!): Profile
    
    # KYC queries
    kycStatus(userId: ID!): KycDetails

    # Project queries
    project(id: ID!): Project
    projectBySlug(slug: String!): Project
    projects(input: ProjectListInput): ProjectListResponse!

    # Listing queries
    listing(id: ID!): Listing
    listingBySlug(slug: String!): Listing
    listings(input: ListingListInput): ListingListResponse!
    listingStats: ListingStats!
    myListings(input: ListingListInput): ListingListResponse!
    featuredListings(limit: Int): [Listing]!
    nearbyListings(latitude: Float!, longitude: Float!, radiusKm: Float, limit: Int): [Listing]!

    # Lead queries
    lead(id: ID!): Lead
    leads(input: LeadListInput): LeadListResponse!
    myLeadsAsBuyer(input: LeadListInput): LeadListResponse!
    myLeadsAsOwner(input: LeadListInput): LeadListResponse!

    # Review queries
    review(id: ID!): Review
    reviews(input: ReviewListInput): ReviewListResponse!
    userReviews(userId: ID!, input: ReviewListInput): ReviewListResponse!

    # Amenity queries
    amenity(id: ID!): Amenity
    amenities(category: AmenityCategory): [Amenity]!

    # Subscription queries
    subscription(id: ID!): Subscription
    userSubscriptions(userId: ID!): [Subscription]!
    activeSubscription(userId: ID!): Subscription

    # ImageKit queries
    imageKitAuthParams: ImageKitAuthParams!
    imageKitFiles(path: String, limit: Int): [ImageKitFile]!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  type Mutation {
    # Auth mutations
    register(input: RegisterInput!): AuthResponse!
    verifyOtp(input: VerifyOtpInput!): LoginResponse!
    resendOtp(input: ResendOtpInput!): AuthResponse!
    login(input: LoginInput!): LoginResponse!
    
    # User mutations
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): SuccessResponse!
    updatePassword(id: ID!, input: UpdatePasswordInput!): SuccessResponse!
    blockUser(id: ID!): User!
    unblockUser(id: ID!): User!
    verifyUser(id: ID!): User!
    updateUserRole(id: ID!, role: UserRole!): User!
    
    # Profile mutations
    upsertProfile(userId: ID!, input: UpdateProfileInput!): Profile!
    
    # KYC mutations
    submitAadharKyc(userId: ID!, input: SubmitAadharKycInput!): KycDetails!
    submitPanKyc(userId: ID!, input: SubmitPanKycInput!): KycDetails!
    verifyKyc(userId: ID!, input: VerifyKycInput!): KycDetails!

    # Project mutations
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): SuccessResponse!

    # Listing mutations
    createListing(input: CreateListingInput!): Listing!
    updateListing(id: ID!, input: UpdateListingInput!): Listing!
    deleteListing(id: ID!): SuccessResponse!
    publishListing(id: ID!): Listing!
    unpublishListing(id: ID!): Listing!
    featureListing(id: ID!, days: Int!): Listing!
    verifyListing(id: ID!): Listing!
    incrementListingViews(id: ID!): Listing!
    incrementListingClicks(id: ID!): Listing!
    
    # Listing images
    addListingImage(listingId: ID!, input: ListingImageInput!): ListingImage!
    removeListingImage(imageId: ID!): SuccessResponse!
    reorderListingImages(listingId: ID!, imageIds: [ID!]!): [ListingImage]!
    
    # Listing amenities
    addListingAmenity(listingId: ID!, amenityId: ID!, isHighlighted: Boolean): AmenityOnListing!
    removeListingAmenity(listingId: ID!, amenityId: ID!): SuccessResponse!

    # Lead mutations
    createLead(input: CreateLeadInput!): Lead!
    updateLeadStatus(id: ID!, input: UpdateLeadInput!): Lead!
    deleteLead(id: ID!): SuccessResponse!

    # Review mutations
    createReview(input: CreateReviewInput!): Review!
    updateReview(id: ID!, input: UpdateReviewInput!): Review!
    deleteReview(id: ID!): SuccessResponse!

    # Amenity mutations (admin)
    createAmenity(input: CreateAmenityInput!): Amenity!
    updateAmenity(id: ID!, input: UpdateAmenityInput!): Amenity!
    deleteAmenity(id: ID!): SuccessResponse!

    # Subscription mutations (admin)
    createSubscription(input: CreateSubscriptionInput!): Subscription!
    cancelSubscription(id: ID!): Subscription!
  }
`;
