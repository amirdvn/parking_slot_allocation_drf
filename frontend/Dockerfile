# frontend/Dockerfile

# --- مرحله ۱: Build کردن پروژه React ---
FROM node:22-alpine AS build

WORKDIR /app

# کپی کردن فایل‌های پکیج و نصب وابستگی‌ها
COPY package*.json ./
RUN npm install

# کپی کردن کل سورس‌کد فرانت
COPY . .

# دریافت آدرس API از داکر کامپوز و تزریق آن به Vite
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# بیلد کردن پروژه
RUN npm run build

# --- مرحله ۲: سرو کردن فایل‌های استاتیک با Nginx ---
FROM nginx:alpine

# کپی کردن فایل‌های بیلد شده به پوشه پیش‌فرض Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# کپی کردن کانفیگ Nginx (برای پشتیبانی از React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]