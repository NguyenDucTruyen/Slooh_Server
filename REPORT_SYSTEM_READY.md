# Report System Test Guide

## Post-Migration Updates Completed ✅

The report system has been successfully updated to use the actual Prisma schema fields:

### Changes Made:
1. **Repository**: Updated to use `TrangThaiBaoCao` from `@prisma/client`
2. **Schema Fields**: Now properly using `ngayXoa` and `trangThai` fields
3. **Soft Delete**: Implemented proper soft delete with `ngayXoa`
4. **Status Updates**: Real status updates with `trangThai`
5. **Statistics**: Proper counting with status filtering

### Key Features Now Active:
- ✅ Soft delete functionality (`ngayXoa: null` filtering)
- ✅ Status management (`trangThai` updates)
- ✅ Proper statistics (counts by status)
- ✅ Status filtering in report lists
- ✅ Full CRUD operations

## Testing the API

### 1. Create a Report (User)
```bash
POST /api/v1/baocao
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "maPhong": "your-room-id",
  "noiDung": "This room has inappropriate content and violates community guidelines.",
  "hinhAnh": "https://example.com/evidence.jpg"
}
```

### 2. Get User's Reports
```bash
GET /api/v1/baocao/my-reports
Authorization: Bearer <user-token>
```

### 3. Admin: Get All Reports with Filtering
```bash
GET /api/v1/baocao?page=1&limit=10&trangThai=CHUA_XU_LY&search=inappropriate
Authorization: Bearer <admin-token>
```

### 4. Admin: Update Report Status
```bash
PATCH /api/v1/baocao/{maBaoCao}
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "trangThai": "DA_XU_LY"
}
```

### 5. Admin: Get Statistics
```bash
GET /api/v1/baocao/stats
Authorization: Bearer <admin-token>
```

### 6. Admin: Soft Delete Report
```bash
DELETE /api/v1/baocao/{maBaoCao}
Authorization: Bearer <admin-token>
```

## Database Schema
The migration added these fields to the BAOCAO table:
- `trangThai` (TrangThaiBaoCao, default: CHUA_XU_LY)
- `ngayXoa` (DateTime?, nullable for soft delete)

## Security Features
- Authentication required for all endpoints
- Admin endpoints require `manageReports` permission
- Channel room reporting restricted to members
- Duplicate report prevention
- Comprehensive input validation

The report system is now fully functional with all features enabled! 🎉
