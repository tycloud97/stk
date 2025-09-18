# Ứng dụng quản lý chi tiêu đơn giản

Ứng dụng React một trang giúp ghi nhận chi tiêu hằng ngày và tổng hợp báo cáo theo tháng.

Buổi 1 – _"Team dev vừa onboard"_
---------------------------------

**Tình huống:** Công ty khởi động dự án quản lý chi tiêu. CTO giao nhiệm vụ:

*   Setup **10 user IAM** cho team dev, phân quyền theo vai trò (dev, lead).
    
*   Dựng **EC2** để backend thử nghiệm API nhập chi tiêu.
    
*   Dev than phiền: “cho chúng tôi quyền sudo trên EC2 luôn đi”.
    

👉 Cần quyết định phân quyền hợp lý, tránh sai lầm IAM, đồng thời dựng EC2 với SG phù hợp để team dev có thể truy cập.

Buổi 2 – _"DB bị lộ ra internet"_
---------------------------------

**Tình huống:** Backend cần database. Một dev tự dựng **RDS MySQL public** để test → sếp phát hiện security risk.

*   CTO yêu cầu: RDS Aurora phải private subnet, scale khi user tăng.
    
*   Thêm **Redis cache** cho báo cáo tháng.
    
*   **Route53** cho subdomain api.expense.app.
    

👉 Nhiệm vụ là khắc phục sai lầm của dev, dựng DB trong VPC private, quản lý kết nối an toàn, và giải thích rõ vì sao không được expose DB ra ngoài.

Buổi 3 – _"Ứng dụng chậm & phí tăng"_
-------------------------------------

**Tình huống:** Frontend React build xong, host tạm trên EC2 → user than load chậm, cost tăng.

*   CTO muốn host React trên **S3 + CloudFront** để giảm phí và tăng tốc độ.
    
*   Người dùng bắt đầu upload ảnh minh họa cho chi tiêu → cần **S3 bucket với versioning, encryption**.
    

👉 Giải pháp là deploy React app lên S3 + CloudFront, cấu hình HTTPS bằng ACM, và tối ưu storage lifecycle để tiết kiệm chi phí.

Buổi 4 – _"DevOps war: Docker hay Serverless?"_
-----------------------------------------------

**Tình huống:** Team backend cãi nhau:

*   Nhóm A: “Dùng **ECS Fargate**, dễ deploy microservice.”
    
*   Nhóm B: “Dùng **Lambda + API Gateway**, serverless mới xịn.”
    
*   CTO bảo: “Dựng cả 2 để so sánh.”
    

👉 Nhiệm vụ là deploy một service backend bằng ECS Fargate + ECR, và một service khác bằng Lambda + API Gateway. Sau đó so sánh chi phí, scaling, latency.

Buổi 5 – _"Dev push code lỗi"_
------------------------------

**Tình huống:** Một dev push code hỏng → EC2 production crash. CTO mắng: “Tại sao chưa có CI/CD pipeline?”

*   Yêu cầu: Tạo pipeline **CodeCommit → CodeBuild → CodeDeploy → ECS**.
    
*   Hạ tầng phải IaC (**CloudFormation/CDK**).
    

👉 Cần dựng CI/CD pipeline, tự động build & deploy, rollback khi lỗi. Sau đó demo pipeline chạy end-to-end.

Buổi 6 – _"Khách hàng báo app chậm"_
------------------------------------

**Tình huống:** User báo app load chậm vào cuối tháng. CTO bảo: “Phải có monitoring và alert.”

*   Thu thập log từ ECS + Lambda.
    
*   Tạo **dashboard CloudWatch** để xem traffic, DB CPU, error rate.
    
*   Cảnh báo khi chi tiêu vượt ngưỡng qua **SNS email**.
    
*   Thêm **Cognito** để user có thể login bằng Google.
    

👉 Giải pháp là thiết lập monitoring, tạo alarm → SNS email, và tích hợp login OAuth2.

Buổi 7 – _"Audit & Compliance"_
-------------------------------

**Tình huống:** Công ty chuẩn bị gọi vốn, auditor yêu cầu:

*   Mọi secret (DB password) phải lưu trong **Secrets Manager**.
    
*   Dữ liệu tài chính phải mã hóa bằng **KMS**.
    
*   Cấu hình workflow báo cáo tháng bằng **Step Functions**.
    

👉 Nhiệm vụ là đưa secrets ra khỏi code, cấu hình KMS cho S3 + RDS, và xây dựng Step Function pipeline để generate monthly report.

Buổi 8 – _"Investor Demo Day"_
------------------------------

**Tình huống:** Ngày demo cho nhà đầu tư:

*   CTO muốn trình bày toàn kiến trúc hệ thống.
    
*   Phải chứng minh hệ thống **scale tốt, bảo mật tốt, cost hợp lý**.
    
*   CEO bất ngờ hỏi: “Nếu user tăng gấp 10 thì chi phí ra sao?”