# Report System (Báo Cáo) Documentation

## Overview
This implementation provides a comprehensive report system for the Slooh application, allowing users to report rooms and administrators to manage these reports.

## Database Schema Changes

### Added to `schema.prisma`:
1. **New Enum**: `TrangThaiBaoCao`
   - `CHUA_XU_LY` (Not processed)
   - `DA_XU_LY` (Processed)

2. **Updated BAOCAO table**:
   - Added `trangThai` field (TrangThaiBaoCao, default: CHUA_XU_LY)
   - Added `ngayXoa` field (DateTime?, for soft delete)

## API Endpoints

### Base URL: `/api/v1/baocao`

#### User Endpoints (Authentication Required)

1. **POST /** - Create Report
   - **Body**: `{ maPhong: string, noiDung: string, hinhAnh?: string }`
   - **Permission**: Any authenticated user (with room access rules)
   - **Rules**: 
     - Public rooms: Anyone can report
     - Channel rooms: Only channel members can report
     - Cannot report the same room twice

2. **GET /my-reports** - Get User's Reports
   - **Response**: List of reports created by the current user

#### Admin Endpoints (Admin Authentication Required)

3. **GET /** - Get All Reports
   - **Query**: `page?, limit?, trangThai?, search?`
   - **Permission**: Admin with `manageReports` role
   - **Features**: Pagination, filtering by status, search

4. **GET /:maBaoCao** - Get Report Details
   - **Permission**: Admin with `manageReports` role

5. **PATCH /:maBaoCao** - Update Report Status
   - **Body**: `{ trangThai: 'CHUA_XU_LY' | 'DA_XU_LY' }`
   - **Permission**: Admin with `manageReports` role

6. **DELETE /:maBaoCao** - Delete Report
   - **Permission**: Admin with `manageReports` role
   - **Note**: Currently hard delete, will be soft delete after schema migration

7. **GET /phong/:maPhong** - Get Reports by Room
   - **Permission**: Admin with `manageReports` role

8. **GET /stats** - Get Report Statistics
   - **Permission**: Admin with `manageReports` role
   - **Response**: `{ total, chuaXuLy, daXuLy }`

## File Structure

```
src/
├── repositories/baoCao.repository.ts    # Database operations
├── services/baoCao.service.ts           # Business logic
├── controllers/baoCao.controller.ts     # Request handlers
├── routes/v1/baoCao.route.ts           # Route definitions
├── validations/baoCao.validation.ts     # Input validation schemas
└── config/roles.ts                      # Added 'manageReports' permission
```

## Business Logic

### Report Creation Rules
1. **Public Rooms**: Any authenticated user can report
2. **Channel Rooms**: Only channel members can report
3. **Duplicate Prevention**: Users cannot report the same room multiple times
4. **Content Validation**: Reports must have 10-1000 characters

### Admin Management Features
1. **List Reports**: Paginated list with filtering and search
2. **Status Management**: Update report status (CHUA_XU_LY/DA_XU_LY)
3. **Detailed View**: Full report information including user and room details
4. **Statistics**: Overview of report counts by status
5. **Room-specific Reports**: View all reports for a specific room

## Migration Notes

Currently, the implementation includes placeholder logic for the new schema fields (`trangThai`, `ngayXoa`) because the database migration hasn't been run yet. After running the migration:

1. Uncomment the schema-related code in the repository
2. Update imports to use `TrangThaiBaoCao` from `@prisma/client`
3. Enable soft delete functionality
4. Enable status filtering functionality

## Usage Examples

### Create a Report
```typescript
POST /api/v1/baocao
Authorization: Bearer <token>
Content-Type: application/json

{
  "maPhong": "room-uuid",
  "noiDung": "This room contains inappropriate content...",
  "hinhAnh": "https://example.com/evidence.jpg"
}
```

### Admin: Get Reports with Filtering
```typescript
GET /api/v1/baocao?page=1&limit=10&trangThai=CHUA_XU_LY&search=inappropriate
Authorization: Bearer <admin-token>
```

### Admin: Update Report Status
```typescript
PATCH /api/v1/baocao/{maBaoCao}
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "trangThai": "DA_XU_LY"
}
```

## Security Features

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Admin endpoints require `manageReports` permission
3. **Input Validation**: Comprehensive validation using Joi schemas
4. **Access Control**: Room reporting follows channel membership rules
5. **Duplicate Prevention**: Prevents spam reporting

## Error Handling

The system provides comprehensive error handling with appropriate HTTP status codes and Vietnamese error messages:
- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 409: Conflict (duplicate report)
- 500: Internal Server Error

## Next Steps

1. **Run Database Migration**: Execute the schema migration to add new fields
2. **Update Implementation**: Remove placeholder logic and enable full functionality
3. **Add Notifications**: Implement admin notifications for new reports
4. **Add Email Alerts**: Notify room owners of reports (if applicable)
5. **Add Analytics**: Track reporting trends and patterns
