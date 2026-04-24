# DESIGN.md — Sistem Tasarım Dökümanı

## Genel Mimari

Bu proje, backend için NestJS ve frontend için Nuxt 3 kullanan modüler bir mimari üzerine inşa edilmiştir. Sistem; bir emlak danışmanlık şirketi için taşınmaz işlemlerini, komisyon dağılımını ve emlak danışmanı yönetimini yönetmektedir.

---

## Backend Mimarisi

### Modül Yapısı

- **AuthModule** — Kullanıcı kimlik doğrulama, JWT, rol bazlı erişim, davet sistemi
- **AgentsModule** — Emlak danışmanı CRUD işlemleri
- **TransactionsModule** — İşlem yaşam döngüsü, aşama yönetimi, komisyon hesaplama

### Teknoloji Seçimleri

- **NestJS** — Modüler mimarisi, yerleşik bağımlılık enjeksiyonu ve TypeScript desteği nedeniyle tercih edildi
- **MongoDB Atlas** — Esnek şema yapısı ve bulut barındırma için NoSQL veritabanı tercih edildi
- **Mongoose** — Şema doğrulama ve sorgu oluşturma için ODM katmanı
- **JWT + Passport** — REST API'ler için uygun durumsuz kimlik doğrulama
- **bcryptjs** — Güvenli şifre hashleme

---

## Veri Modelleri

### Kullanıcı (User)
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (benzersiz)",
  "password": "string (hashlenmiş)",
  "role": "admin | agent",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Emlak Danışmanı (Agent)
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (benzersiz)",
  "phone": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Davet (Invite)
```json
{
  "_id": "ObjectId",
  "email": "string (benzersiz)",
  "used": "boolean",
  "createdAt": "Date"
}
```

### İşlem (Transaction)
```json
{
  "_id": "ObjectId",
  "propertyAddress": "string",
  "salePrice": "number",
  "totalServiceFee": "number",
  "stage": "agreement | earnest_money | title_deed | completed",
  "transactionType": "sale | rent",
  "propertyType": "house | apartment | land | shop | office | other",
  "city": "string",
  "listingAgent": "ObjectId (ref: Agent)",
  "sellingAgent": "ObjectId (ref: Agent)",
  "createdBy": "ObjectId (ref: User)",
  "commissionBreakdown": {
    "totalServiceFee": "number",
    "agencyAmount": "number",
    "listingAgentAmount": "number",
    "sellingAgentAmount": "number"
  },
  "notes": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## Komisyon Dağılımı Saklama Yöntemi

Komisyon dağılımı, işlem `completed` aşamasına geçtiğinde hesaplanarak **doğrudan işlem dökümanına gömülmektedir**. Bu yaklaşım şu nedenlerle tercih edildi:

- Ekstra koleksiyon ve JOIN benzeri sorgulardan kaçınılır
- Finansal veriler işlemle birlikte tutulur
- Komisyon kuralları gelecekte değişse bile geçmiş kayıtlar doğru kalır

---

## Aşama Geçişleri

Geçişler kesinlikle sıralıdır:
agreement → earnest_money → title_deed → completed

- Geçersiz geçişler (aşama atlama, geri gitme) `BadRequestException` fırlatır
- `completed` aşamasına geçişte komisyon otomatik hesaplanır
- Tamamlanan işlemler düzenlenemez veya silinemez

---

## Komisyon Kuralları

- Acente her zaman `totalServiceFee`'nin **%50**'sini alır
- `listingAgent === sellingAgent` ise: o danışman ajan havuzunun tamamını (**%50**) alır
- `listingAgent !== sellingAgent` ise: her biri **%25** alır

### Kiralama Komisyonu
- Komisyon = aylık kira × kira sayısı (1, 2 veya 3)

### Satış Komisyonu
- Komisyon sabit tutar (₺) veya satış fiyatının yüzdesi olarak girilebilir

---

## Kimlik Doğrulama ve Yetkilendirme

### JWT Stratejisi
- Token içeriği: `{ sub: userId, email, role }`
- Token geçerlilik süresi: 7 gün
- Gizli anahtar `JWT_SECRET` ortam değişkeninde saklanır

### Rol Bazlı Erişim
- **Admin**: Tüm endpoint'lere tam erişim
- **Emlak Danışmanı**: Yalnızca dahil olduğu işlemleri görebilir (listeleyen veya satan danışman olarak)

### Davet Sistemi
- Emlak danışmanları yalnızca admin tarafından davet edilen e-posta adresleriyle kayıt olabilir
- Her davet yalnızca bir kez kullanılabilir (kayıt sonrası `used: true` olur)
- Admin bekleyen davetleri görüntüleyebilir, oluşturabilir ve silebilir

---

## API Endpoint'leri

### Kimlik Doğrulama (Auth)
| Metot | Endpoint | Erişim | Açıklama |
|-------|----------|--------|----------|
| POST | /auth/register | Herkese Açık | Yeni kullanıcı kaydı |
| POST | /auth/login | Herkese Açık | Giriş yap |
| GET | /auth/me | Giriş Yapılmış | Mevcut kullanıcıyı getir |
| POST | /auth/invite | Admin | Emlak danışmanı davet et |
| GET | /auth/invites | Admin | Davetleri listele |
| DELETE | /auth/invites/:id | Admin | Daveti sil |
| GET | /auth/users | Admin | Kullanıcıları listele |
| DELETE | /auth/users/:id | Admin | Kullanıcıyı sil |
| PATCH | /auth/users/:id/role | Admin | Kullanıcı rolünü güncelle |

### Emlak Danışmanları (Agents)
| Metot | Endpoint | Erişim | Açıklama |
|-------|----------|--------|----------|
| POST | /agents | Giriş Yapılmış | Danışman oluştur |
| GET | /agents | Giriş Yapılmış | Danışmanları listele |
| GET | /agents/:id | Giriş Yapılmış | Danışman getir |

### İşlemler (Transactions)
| Metot | Endpoint | Erişim | Açıklama |
|-------|----------|--------|----------|
| POST | /transactions | Giriş Yapılmış | İşlem oluştur |
| GET | /transactions | Giriş Yapılmış | İşlemleri listele |
| GET | /transactions/:id | Giriş Yapılmış | İşlem getir |
| PATCH | /transactions/:id/stage | Giriş Yapılmış | Aşama güncelle |
| PATCH | /transactions/:id | Giriş Yapılmış | İşlem güncelle |
| DELETE | /transactions/:id | Giriş Yapılmış | İşlem sil |
| GET | /transactions/summary/financial | Giriş Yapılmış | Finansal özet |
| GET | /transactions/summary/agent-earnings | Giriş Yapılmış | Danışman kazançları |

---

## Frontend Mimarisi

### Sayfalar
| Sayfa | Yol | Erişim |
|-------|-----|--------|
| Giriş | /login | Herkese Açık |
| Kayıt | /register | Herkese Açık |
| Dashboard | / | Giriş Yapılmış |
| Yeni İşlem | /transactions/new | Giriş Yapılmış |
| İşlem Detayı | /transactions/:id | Giriş Yapılmış |
| Emlak Danışmanları | /agents | Admin |
| Danışman Detayı | /agents/:id | Admin |
| Finans Raporu | /reports | Admin |
| Kullanıcı Yönetimi | /users | Admin |

### Durum Yönetimi (Pinia)
- **useAuthStore** — JWT token, kullanıcı bilgisi, giriş/çıkış, localStorage kalıcılığı
- **useAgentsStore** — Danışman listesi, getirme, oluşturma
- **useTransactionsStore** — İşlem listesi, mevcut işlem, aşama güncellemeleri

### Kimlik Doğrulama Akışı
1. Kullanıcı herhangi bir sayfayı ziyaret eder → middleware localStorage'da token kontrol eder
2. Token yoksa → `/login` sayfasına yönlendirilir
3. Token varsa → Pinia store'a yüklenir → erişime izin verilir
4. Her API isteği `Authorization: Bearer <token>` başlığı içerir

### Rol Bazlı Arayüz
- **Admin**: Tüm işlemler, danışmanlar sayfası, finans raporu, kullanıcı yönetimi
- **Emlak Danışmanı**: Yalnızca kendi işlemleri ve kişisel kazanç özeti

---

## Deployment

| Bileşen | Platform | URL |
|---------|----------|-----|
| Backend | Railway | https://realty-backend-production-9037.up.railway.app |
| Frontend | Vercel | https://realty-frontend-gamma.vercel.app |
| Veritabanı | MongoDB Atlas | Bulut (M0 Ücretsiz Katman) |

### Ortam Değişkenleri

**Backend (Railway)**
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
PORT=3001

**Frontend (Vercel)**
NUXT_PUBLIC_API_BASE=https://realty-backend-production-9037.up.railway.app

---

## Tasarım Kararları

### Neden commissionBreakdown işlem içine gömüldü?
Finansal veriler hesaplandıktan sonra değişmez olmalıdır. Gömme yaklaşımı, komisyon kuralları gelecekte değişse bile geçmiş kayıtların doğru kalmasını sağlar.

### Neden yalnızca davetiye ile kayıt?
Emlak ofisleri sisteme kimin erişebileceği konusunda sıkı kontrol gerektirir. Davet sistemi yalnızca onaylı danışmanların kayıt olmasını sağlar.

### Neden Agent ve User koleksiyonları ayrı?
Kullanıcılar kimlik doğrulamayı yönetir (giriş, JWT, roller). Danışmanlar iş mantığını yönetir (işlemler, komisyonlar). Bunları ayrı tutmak, danışman olmayan admin kullanıcılara ve bir kullanıcı hesabı silinse bile danışman verisi bütünlüğüne olanak tanır.

### Neden SQL yerine MongoDB?
İşlem dökümanları değişken yapıya sahiptir (commissionBreakdown yalnızca tamamlanan işlemlerde, propertyType yalnızca satış işlemlerinde bulunur). MongoDB'nin esnek şeması bunu null sütunlar olmadan doğal olarak karşılar.