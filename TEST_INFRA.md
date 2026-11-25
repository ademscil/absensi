# E2E Test Infra: Absensi Mobile-First & Spatial UI Mockup

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Interaction Testing + Real-World Workload Testing.
- Standard runner: Vitest 5.x with jsdom environment.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | R1: Antarmuka Interaktif, Anime.js, Spatial 3D UI | ORIGINAL_REQUEST §R1 | 6 | 6 | ✓ |
| 2 | R2: Presensi Kamera Selfie Live & Watermark Canvas | ORIGINAL_REQUEST §R2 | 6 | 6 | ✓ |
| 3 | R3: Role Karyawan & Admin HR serta Workflow Perizinan | ORIGINAL_REQUEST §R3 | 6 | 6 | ✓ |
| 4 | R4: Rekapitulasi Data dan Ekspor Excel | ORIGINAL_REQUEST §R4 | 6 | 6 | ✓ |
| 5 | R5: Multi-Tenant & White-Label Preset Switcher | ORIGINAL_REQUEST §R5 | 6 | 6 | ✓ |
| 6 | R6: Git Repository Remote & Author Verification | ORIGINAL_REQUEST §R6 | 6 | 6 | ✓ |

## Test Architecture
- **Test runner**: Vitest with jsdom environment (`vitest.config.js`). Invocation via `npm test` or `npx vitest run`.
- **Test case format**: Vitest JSX/JS test suites with `@testing-library/react` and `@testing-library/jest-dom` assertions.
- **Directory layout**:
  ```
  d:\aplikasi\absensi\tests\
  ├── setup.js
  ├── mocks\
  │   ├── canvasMock.js
  │   ├── mediaMock.js
  │   └── excelMock.js
  └── e2e\
      ├── tier1\
      │   ├── r1_spatial_ui.test.jsx
      │   ├── r2_camera_watermark.test.jsx
      │   ├── r3_role_workflow.test.jsx
      │   ├── r4_recap_excel.test.jsx
      │   ├── r5_multitenant.test.jsx
      │   └── r6_git_config.test.js
      ├── tier2\
      │   ├── r1_ui_boundaries.test.jsx
      │   ├── r2_watermark_boundaries.test.jsx
      │   ├── r3_workflow_boundaries.test.jsx
      │   ├── r4_excel_boundaries.test.jsx
      │   ├── r5_multitenant_boundaries.test.jsx
      │   └── r6_git_boundaries.test.js
      ├── tier3\
      │   ├── state_sync_karyawan_hr.test.jsx
      │   ├── multitenant_data_isolation.test.jsx
      │   └── quota_stress_persistence.test.jsx
      └── tier4\
          ├── full_day_attendance_workflow.test.jsx
          ├── leave_request_approval_deduction.test.jsx
          └── end_to_end_recap_export.test.jsx
  ```

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full Day Attendance Workflow: Login -> Selfie check-in -> Clock & Geofence check -> Check-out | R1, R2, R3, R5 | High |
| 2 | Complete Leave Request & HR Approval Lifecycle: Karyawan submits cuti -> HR reviews in queue -> HR approves with notes -> Quota deducted in real-time | R3, R5 | High |
| 3 | Cross-Department Recap & Client-Side Excel Export: Multi-employee check-in -> HR filters recap table -> XLSX generated and validated | R2, R3, R4, R5 | High |
| 4 | Multi-Tenant Shift: Corporate -> Government -> School -> Retail workflow without data pollution | R1, R3, R5 | High |
| 5 | Network/Permission Offline & Simulator Fallback Recovery Workflow | R1, R2, R3 | Medium |
| 6 | End-to-End Release Pre-Flight Check & Git Safety Verification | R6 | Medium |

## Coverage Thresholds
- Tier 1 (Feature Coverage): 36 tests (6 per feature for R1 - R6; minimum threshold >= 5)
- Tier 2 (Boundary & Corner Cases): 36 tests (6 per feature for R1 - R6; minimum threshold >= 5)
- Tier 3 (Cross-Feature Combinations): 12 tests (cross-feature pairwise, state sync, quota limits)
- Tier 4 (Real-World Application Scenarios): 6 tests (realistic multi-step user workflows)
- **Total test suite: 90 tests**
