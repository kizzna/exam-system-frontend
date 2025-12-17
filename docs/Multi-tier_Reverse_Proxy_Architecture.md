# Multi-tier Reverse Proxy Architecture

## Overview
This system use multi-tier reverse proxy architecture to handle requests from 
Cloudflare Ingress (Cloudflare Tunnel) to Nginx (Unified Gateway) to Python Backend.

## Components
1. The Edge Tier (Cloudflare Edge)
- **Role:** Acts as the "Front Door" or **Edge Proxy**.
- **Functions:** Provides Global Load Balancing, DDoS protection, and SSL termination at the location closest to the user (the "Edge").
2. The Ingress/Tunnel Tier (1st Nginx Proxy + Cloudflare Tunnel)
- **Role:** Acts as a **Secure Gateway** or **Ingress Controller**.
- **Functions:** The Cloudflare Tunnel creates a secure outbound connection from your private network to the internet without opening inbound ports. The first Nginx layer often acts as a specialized **Traffic Router** to direct tunnel traffic to the correct internal services.
3. The Application Tier (2nd Nginx Proxy + NextJS, The Unified Gateway)
- **Role:** Acts as an **Application Gateway** or **Reverse Proxy**.
- **Functions:** This layer is typically responsible for application-specific logic like serving static NextJS assets, handling authentication headers, or performing local load balancing before reaching the backend.
4. The Origin Tier (Python FastAPI)
- **Role:** The **Real Subject** or **Origin Server**.
- **Functions:** The Python FastAPI backend handles the actual application logic, database interactions, business rules and generate SSE (Server-Sent Events) stream.

