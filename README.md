# AWS Daily Expense Tracker Curriculum

## Tổng quan case study
Case study "Sổ chi tiêu hàng ngày" giúp học viên xây dựng một ứng dụng serverless trên AWS để ghi nhận, phân tích và báo cáo chi tiêu cá nhân. Mỗi bài học giới thiệu dần các dịch vụ AWS cốt lõi, nhấn mạnh các nguyên tắc bảo mật, khả năng mở rộng và tự động hóa triển khai.

### Mục tiêu học tập chung
- Thiết lập môi trường AWS tuân thủ nguyên tắc bảo mật và quản trị người dùng.
- Xây dựng backend serverless để lưu trữ và truy xuất dữ liệu chi tiêu.
- Triển khai frontend tĩnh kết nối API bảo mật.
- Bổ sung khả năng xác thực người dùng, giám sát hệ thống, OCR hóa đơn và phân tích dữ liệu.
- Áp dụng Infrastructure as Code và quy trình CI/CD tự động.
- Tối ưu bảo mật, chi phí vận hành.

### Đối tượng học viên
- Developer hoặc sinh viên CNTT mới làm quen AWS.
- Đội ngũ sản phẩm muốn hiện thực hóa MVP serverless nhanh chóng.
- Giảng viên cần giáo trình thực hành theo từng bước.

### Yêu cầu đầu vào
- Kiến thức cơ bản về lập trình (Python hoặc JavaScript).
- Tài khoản AWS cá nhân với quyền quản trị.
- Đã cài đặt AWS CLI, Node.js, Python 3, Git.

---

## Lộ trình học

### 🟢 Phần Cơ Bản (Foundations)

| Bài | Chủ đề | Mục tiêu chi tiết | Bài tập/Thực hành | Deliverable |
| --- | ------ | ----------------- | ----------------- | ----------- |
| 1 | IAM – Thiết lập truy cập | - Tạo IAM User/Role dành cho project<br>- Áp dụng least privilege cho S3, DynamoDB<br>- Kích hoạt MFA cho console access | - Tạo user `expense-app-dev` với policy tùy chỉnh chỉ cho phép `S3:PutObject`, `DynamoDB:PutItem` trên resource demo<br>- Cấu hình AWS CLI với access key của user mới | Tài liệu mô tả user, policy JSON, ảnh chụp MFA hoặc mô tả cấu hình |
| 2 | S3 – Lưu trữ dữ liệu thô | - Tạo bucket `daily-expense-logs` (đặt region cụ thể)<br>- Bật versioning, encryption SSE-S3<br>- Thử upload file JSON mẫu | - Dùng AWS CLI hoặc Console upload `{ "date": "2025-09-18", "item": "Coffee", "amount": 50 }` vào thư mục `raw/` | Báo cáo bucket settings, screenshot/CLI output upload |
| 3 | DynamoDB – Dữ liệu có cấu trúc | - Tạo bảng `ExpenseTable` với `PK=userId`, `SK=date`<br>- Định nghĩa TTL optional cho auto archive | - Viết script Python (boto3) hoặc Node.js để thêm một record<br>- Commit script vào repo | Mã nguồn script + kết quả chạy CLI |
| 4 | API Gateway + Lambda | - Thiết kế REST API `/expense` (POST, GET)<br>- Triển khai Lambda truy xuất DynamoDB | - Tạo Lambda `ExpenseHandler` bằng Python hoặc Node.js<br>- Kiểm tra API bằng Postman/curl | Postman collection hoặc log test, mã nguồn Lambda |
| 5 | CloudFront + S3 Website | - Deploy frontend tĩnh chứa form nhập chi tiêu<br>- Tích hợp gọi API Gateway endpoint | - Build trang HTML/JS đơn giản, upload lên S3 Static website<br>- Cấu hình CloudFront distribution caching tối thiểu | Link CloudFront, mã nguồn frontend |

### 🟡 Phần Trung Cấp (Intermediate)

| Bài | Chủ đề | Mục tiêu chi tiết | Bài tập/Thực hành | Deliverable |
| --- | ------ | ----------------- | ----------------- | ----------- |
| 6 | Cognito – Xác thực người dùng | - Tạo User Pool với flow đăng ký/đăng nhập<br>- Tích hợp API Gateway với Cognito Authorizer | - Cập nhật frontend sử dụng Hosted UI hoặc AWS Amplify Auth<br>- Cập nhật Lambda để lấy `sub` từ claims | Demo đăng nhập, hướng dẫn cấu hình |
| 7 | CloudWatch – Logging & Monitoring | - Bật Access logging cho API Gateway<br>- Sử dụng CloudWatch Logs & Metrics, tạo Alarm cơ bản | - Tạo Dashboard hiển thị tổng request, 4xx, 5xx, độ trễ<br>- Thiết lập SNS Alarm khi lỗi 5xx vượt ngưỡng | Ảnh dashboard, cấu hình alarm |
| 8 | S3 + Rekognition – OCR hóa đơn | - Cho phép upload ảnh hóa đơn vào S3 (bucket `daily-expense-receipts`)<br>- Lambda trigger gọi Rekognition `DetectText` | - Viết Lambda phân tích text, chuẩn hóa dữ liệu, lưu vào DynamoDB (mapping userId, date, amount)<br>- Trình bày chiến lược xử lý lỗi | Mã nguồn Lambda OCR, ví dụ dữ liệu OCR |
| 9 | Athena + QuickSight – Báo cáo | - Dùng Glue Crawler/Job ETL dữ liệu từ DynamoDB sang S3 (parquet)<br>- Dùng Athena query phân tích chi tiêu theo tháng/category | - Viết query mẫu (SUM amount, GROUP BY month/category)<br>- Tạo Dashboard QuickSight với biểu đồ cột & doughnut | File SQL, ảnh dashboard |

### 🔴 Phần Nâng Cao (Advanced)

| Bài | Chủ đề | Mục tiêu chi tiết | Bài tập/Thực hành | Deliverable |
| --- | ------ | ----------------- | ----------------- | ----------- |
| 10 | Infrastructure as Code | - Sử dụng AWS CDK (TypeScript) hoặc Terraform để định nghĩa toàn bộ stack<br>- Bao gồm S3, DynamoDB, Lambda, API Gateway, Cognito | - Tổ chức project IaC nhiều stack/layer<br>- Viết hướng dẫn deploy (`cdk deploy` hoặc `terraform apply`) | Repo IaC, tài liệu triển khai |
| 11 | CI/CD với CodePipeline | - Thiết lập pipeline: Source (GitHub) → Build (CodeBuild) → Deploy (CDK & frontend)<br>- Bật manual approval cho môi trường Prod | - Viết buildspec cho backend & frontend<br>- Tạo stage dev/prod riêng | Sơ đồ pipeline, file cấu hình buildspec |
| 12 | Bảo mật & Tối ưu chi phí | - Mã hóa dữ liệu nhạy cảm bằng KMS CMK<br>- Bật AWS Config rules, GuardDuty<br>- Thiết lập AWS Budgets cảnh báo chi phí | - Triển khai policy hạn chế truy cập dữ liệu nhạy cảm<br>- Demo GuardDuty finding, thiết lập budget alert email | Tài liệu security runbook, ảnh Budget alert |

---

## Kế hoạch giảng dạy đề xuất

### Tuần 1: Kiến trúc và nền tảng
- **Buổi 1:** Giới thiệu case study, Bài 1 (IAM) – thực hành tạo user và policy.
- **Buổi 2:** Bài 2 (S3) + Bài 3 (DynamoDB) – lưu dữ liệu thô và cấu trúc.
- **Buổi 3:** Bài 4 (API Gateway + Lambda) – xây dựng API CRUD cơ bản.

### Tuần 2: Frontend và xác thực
- **Buổi 4:** Bài 5 (CloudFront + S3 Website) – publish frontend, test end-to-end.
- **Buổi 5:** Bài 6 (Cognito) – tích hợp xác thực, cập nhật API bảo vệ endpoint.
- **Buổi 6:** Bài 7 (CloudWatch) – theo dõi, logging, tạo dashboard.

### Tuần 3: Tích hợp AI và phân tích dữ liệu
- **Buổi 7:** Bài 8 (Rekognition OCR) – pipeline xử lý hóa đơn.
- **Buổi 8:** Bài 9 (Athena + QuickSight) – xây dựng báo cáo trực quan.

### Tuần 4: Vận hành doanh nghiệp
- **Buổi 9:** Bài 10 (IaC) – CDK/Terraform, quản lý cấu hình.
- **Buổi 10:** Bài 11 (CI/CD) – thiết lập pipeline tự động.
- **Buổi 11:** Bài 12 (Security & Cost) – bảo mật toàn diện, tối ưu chi phí.
- **Buổi 12:** Ôn tập và tổng kết, chuẩn bị đánh giá cuối khóa.

---

## Tài nguyên và tài liệu tham khảo
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Serverless Land](https://serverlessland.com/)
- [AWS Workshops](https://workshops.aws/)
- [AWS Skill Builder](https://skillbuilder.aws/)
- [AWS Samples trên GitHub](https://github.com/aws-samples)

## Đánh giá cuối khóa
- **Project cuối khóa:** Hoàn thiện ứng dụng Expense Tracker với đầy đủ pipeline CI/CD, dashboard, bảo mật.
- **Tiêu chí:**
  - Đáp ứng yêu cầu kỹ thuật từng bài.
  - Tài liệu triển khai rõ ràng, repo có README chi tiết.
  - Báo cáo nêu bật bài học về bảo mật, tối ưu chi phí.

---

## Gợi ý mở rộng sau khóa học
- Tích hợp Amazon Forecast để dự đoán chi tiêu tương lai.
- Dùng Step Functions orchestration cho pipeline nhập liệu phức tạp.
- Triển khai multi-account strategy với AWS Organizations.
- Xây dựng mobile app sử dụng AWS Amplify hoặc Flutter + Amplify.

