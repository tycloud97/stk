# Ứng dụng quản lý chi tiêu đơn giản

Ứng dụng React một trang giúp ghi nhận chi tiêu hằng ngày và tổng hợp báo cáo theo tháng.


📅 Chương trình AWS 8 buổi – Phiên bản tình huống thực tế hấp dẫn
=================================================================

Buổi 1 – _"Team dev vừa onboard"_
---------------------------------

**Tình huống:**Công ty khởi động dự án quản lý chi tiêu. CTO giao bạn:

*   Setup **10 user IAM** cho team dev, phân quyền theo vai trò (dev, lead).
    
*   Dựng **EC2** để backend thử nghiệm API nhập chi tiêu.
    
*   Dev than phiền: “cho chúng tôi quyền sudo trên EC2 luôn đi”.
    

👉 Học viên phải quyết định phân quyền hợp lý, tránh sai lầm IAM, đồng thời dựng EC2 với SG hợp lý để dev truy cập.

Buổi 2 – _"DB bị lộ ra internet"_
---------------------------------

**Tình huống:**Backend cần database. Một dev tự dựng **RDS MySQL public** để test → sếp phát hiện security risk.

*   CTO yêu cầu: RDS Aurora phải private subnet, scale khi user tăng.
    
*   Thêm **Redis cache** cho báo cáo tháng.
    
*   **Route53** cho subdomain api.expense.app.
    

👉 Học viên phải sửa sai của dev, dựng DB trong VPC private, quản lý kết nối an toàn, và giải thích cho team vì sao không expose DB ra ngoài.

Buổi 3 – _"Ứng dụng chậm & phí tăng"_
-------------------------------------

**Tình huống:**Frontend React build xong, host tạm trên EC2 → user than load chậm, cost tăng.

*   CTO muốn host React trên **S3 + CloudFront** để giảm phí và tăng tốc độ.
    
*   Người dùng bắt đầu upload ảnh minh họa cho chi tiêu → cần **S3 bucket với versioning, encryption**.
    

👉 Học viên sẽ deploy React app lên S3 + CloudFront, cấu hình HTTPS bằng ACM, và tối ưu storage lifecycle để tiết kiệm chi phí.

Buổi 4 – _"DevOps war: Docker hay Serverless?"_
-----------------------------------------------

**Tình huống:**Team backend cãi nhau:

*   Nhóm A: “Dùng **ECS Fargate**, dễ deploy microservice.”
    
*   Nhóm B: “Dùng **Lambda + API Gateway**, serverless mới xịn.”
    
*   CTO bảo: “Dựng cả 2 để so sánh.”
    

👉 Học viên sẽ deploy một service backend bằng ECS Fargate + ECR, và một service khác bằng Lambda + API Gateway. So sánh chi phí, scaling, latency.

Buổi 5 – _"Dev push code lỗi"_
------------------------------

**Tình huống:**Một dev push code hỏng → EC2 production crash. CTO mắng: “Tại sao chưa có CI/CD pipeline?”

*   Yêu cầu: Tạo pipeline **CodeCommit → CodeBuild → CodeDeploy → ECS**.
    
*   Hạ tầng phải IaC (**CloudFormation/CDK**).
    

👉 Học viên sẽ dựng CI/CD pipeline, tự động build & deploy, rollback khi lỗi. Sau đó demo pipeline chạy end-to-end.

Buổi 6 – _"Khách hàng báo app chậm"_
------------------------------------

**Tình huống:**User báo app load chậm vào cuối tháng. CTO bảo: “Phải có monitoring và alert.”

*   Thu thập log từ ECS + Lambda.
    
*   Tạo **dashboard CloudWatch** để xem traffic, DB CPU, error rate.
    
*   Cảnh báo khi chi tiêu vượt ngưỡng qua **SNS email**.
    
*   Thêm **Cognito** để user có thể login bằng Google.
    

👉 Học viên dựng monitoring thực chiến, tạo alarm → SNS email, và tích hợp login OAuth2.

Buổi 7 – _"Audit & Compliance"_
-------------------------------

**Tình huống:**Công ty chuẩn bị gọi vốn, auditor yêu cầu:

*   Mọi secret (DB password) phải lưu trong **Secrets Manager**.
    
*   Dữ liệu tài chính phải mã hóa bằng **KMS**.
    
*   Cấu hình workflow báo cáo tháng bằng **Step Functions**.
    

👉 Học viên chuyển secrets ra khỏi code, cấu hình KMS cho S3 + RDS, và build Step Function pipeline để generate monthly report.

Buổi 8 – _"Investor Demo Day"_
------------------------------

**Tình huống:**Ngày demo cho nhà đầu tư:

*   CTO muốn trình bày toàn kiến trúc hệ thống.
    
*   Phải chứng minh hệ thống **scale tốt, bảo mật tốt, cost hợp lý**.
    
*   CEO bất ngờ hỏi: “Nếu user tăng gấp 10 thì chi phí ra sao?”
    

👉 Học viên sẽ dựng sơ đồ kiến trúc tổng thể, chạy thử load test, dùng **Cost Explorer** để dự đoán chi phí, và trả lời câu hỏi của nhà đầu tư.

💡 Ý nghĩa
----------

*   Mỗi buổi = một “drama” mà Cloud Engineer phải xử lý.
    
*   Người học thấy ngay ý nghĩa thực tế → không khô khan.
    
*   Tất cả dịch vụ AWS đều gắn liền với **ứng dụng chi tiêu**.
    

🏗️ Kiến trúc hệ thống (Mermaid Diagram)
========================================

flowchart TB
    subgraph Client["Người dùng"]
        browser["React App (Browser)"]
    end

    subgraph AWS["AWS Cloud"]
        subgraph Network["Networking & Security"]
            route53["Route53 (DNS)"]
            alb["ALB / CloudFront"]
            vpc["VPC (2 Public + 2 Private Subnets)"]
        end

        subgraph Frontend["Frontend Hosting"]
            s3_static["S3 (React App)"]
            cloudfront["CloudFront CDN + ACM Cert"]
        end

        subgraph Backend["Backend Services"]
            ecs["ECS Fargate (API Service)"]
            lambda["Lambda (Monthly Report)"]
            apigw["API Gateway"]
        end

        subgraph Database["Data Layer"]
            aurora["Aurora MySQL (Chi tiêu)"]
            redis["ElastiCache Redis (Cache báo cáo)"]
        end

        subgraph Auth["Authentication"]
            cognito["Cognito (Login with Google)"]
        end

        subgraph Monitoring["Monitoring & Events"]
            cloudwatch["CloudWatch Logs & Metrics"]
            sns["SNS (Email Alerts)"]
            eventbridge["EventBridge Rules"]
        end

        subgraph Secrets["Security"]
            secrets["Secrets Manager (DB Creds)"]
            kms["KMS (Data Encryption)"]
        end

        subgraph CICD["CI/CD Pipeline"]
            codecommit["CodeCommit (Repo)"]
            codebuild["CodeBuild"]
            codedeploy["CodeDeploy"]
            codepipeline["CodePipeline"]
        end
    end

    browser --> route53 --> cloudfront --> s3_static
    cloudfront --> ecs
    browser --> apigw --> ecs
    ecs --> aurora
    ecs --> redis
    apigw --> lambda --> aurora

    cognito --> browser
    cognito --> apigw

    ecs --> cloudwatch
    lambda --> cloudwatch
    cloudwatch --> sns
    eventbridge --> sns

    secrets --> ecs
    kms --> aurora
    kms --> s3_static

    codecommit --> codebuild --> codedeploy --> ecs
    codecommit --> codebuild --> codedeploy --> lambda
    codepipeline --> codebuild


🎯 Tóm tắt kiến trúc
--------------------

*   **Frontend**: React build → S3 → CloudFront phân phối toàn cầu.
    
*   **Backend**: ECS Fargate chạy API, Lambda xử lý báo cáo tháng.
    
*   **Database**: Aurora MySQL chính, Redis tăng tốc báo cáo.
    
*   **Auth**: Cognito cho login bằng Google.
    
*   **CI/CD**: Mỗi commit → CodePipeline build & deploy ra ECS/Lambda.
    
*   **Monitoring**: CloudWatch theo dõi, SNS gửi cảnh báo email khi vượt ngưỡng.
    
*   **Security**: Secrets Manager quản lý DB password, KMS mã hóa dữ liệu.