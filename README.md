# Restaurant Menu

A restaurant ordering web app built with Next.js (App Router), TypeScript, Tailwind CSS and Firebase (Firestore, Auth, Storage). The project contains two main user experiences:

- Staff/Admin: manage menu items, categories, orders, and generate QR links for tables.
- Customer: mobile-first menu, cart, order submission, and live order status updates.

This README documents how to run, configure, and contribute to the project.

## Tech stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Firebase Firestore, Auth, Storage
- Zustand (cart store)
- react-hot-toast, lucide-react, qrcode.react, jsPDF

## Features

- Admin dashboard: add/edit/delete menu items and categories, view and manage orders.
- Customer menu: responsive grid, item details modal, cart drawer, place orders.
- Live order status via Firestore real-time listeners.
- QR generator for table links (uses current origin).
- Light/dark theme and multilingual UI (Uzbek, Russian, English).

## Quick start

Prerequisites:

- Node.js 18+ and npm
- A Firebase project with Firestore, Authentication (email/password) and Storage enabled

1. Install dependencies

```bash
npm install
```

2. Add environment variables

Create a `.env.local` file at the project root and add your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. Run development server

```bash
npm run dev
```

4. Build for production

```bash
npm run build
npm start
```

## Firebase setup notes

- Firestore collections used (conventions):
	- `menu_items` — documents for menu items (fields: `name`, `description`, `isAvailable`, `sizes`, `crusts`, `extras`, `image`, `createdAt`, ...)
	- `categories` — menu categories used for item grouping
	- `orders` — order documents with `tableId`, `items`, `totalAmount`, `status`, `createdAt`, `paymentStatus`, `comment`, ...
- Authentication: staff uses Firebase Auth (email/password flow in staff login pages).
- Storage: store menu images in Firebase Storage and save URLs in `menu_items.image`.

Recommended Firestore indexes (if you start getting warnings):
- `orders` collection: index on `tableId` + `status` for efficient queries used in the customer view.

## Environment & security

- Keep `.env.local` out of VCS (it's already in `.gitignore`). Do not commit secrets.
- When deploying (Vercel, Netlify), set the same environment variables in the platform settings.

## Project structure (important files)

- `app/` — Next.js App Router
	- `(staff)/admin` — admin pages (menu management, orders, QR)
	- `(customer)/menu/[tableId]` — customer menu, cart, orders
	- `not-found.tsx` — redirect behavior to admin
- `components/` — shared UI building blocks (admin/customer/ui)
- `lib/firebase.ts` — firebase initialization
- `lib/db.ts` — helper functions for Firestore/Storage operations
- `store/useCart.ts` — Zustand cart store (persisted)
- `public/` — static assets

## Scripts

- `npm run dev` — start dev server
- `npm run build` — build production assets
- `npm start` — start production server

## Deployment

- Vercel is recommended (first-class support for Next.js). Ensure environment variables are set in the Vercel dashboard.
- The QR generator uses `window.location.origin`, so generated links will use the deployed domain automatically.

## Contributing

- Keep changes focused and run `npm run build` to check for TypeScript or runtime errors.
- Follow Tailwind patterns used across `components/` for consistent styling.

## Troubleshooting

- Orders not appearing on another device: ensure orders are stored in Firestore and the client is using the same `tableId` and querying statuses (`yangi`, `tayyorlanmoqda`, `tayyor`).
- If images fail to load after upload, verify Storage rules and that `menu_items.image` contains a public (or authenticated) URL.

## Notes

- Language and theme preferences are stored locally under `customer_lang` and `customer_theme`.
- The project previously used a per-device localStorage list for order IDs; current behavior uses Firestore for visibility to avoid cross-device mismatches.

## License

Add a `LICENSE` file if you plan to open-source the project. Currently there is no license included.

---

If you want, I can also add a short developer README section with common dev commands and debugging tips, or add Firebase security rules examples.
