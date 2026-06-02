# Gathering Mobile — Session Summary

## What We Did
Converted the Gathering web application (React + Vite + Mantine) to a React Native mobile application using Expo.

### Key Decisions Made
- **Framework:** Expo SDK 54 (blank TypeScript template)
- **Navigation:** Expo Router with file-based routing
- **Styling:** Plain `StyleSheet` (no NativeWind — kept simple)
- **Auth storage:** `expo-secure-store` replacing `react-cookie`
- **Forms:** `react-hook-form` replacing `@mantine/form`
- **Notifications:** `react-native-toast-message` replacing `@mantine/notifications`
- **Icons:** `@expo/vector-icons` (MaterialIcons, Ionicons) replacing `@phosphor-icons/react`
- **Calendar:** `react-native-calendars` replacing `@mantine/dates`
- **Data fetching:** `@tanstack/react-query` (unchanged)
- **Date utilities:** `dayjs` (unchanged)
- **Utilities:** `lodash` (unchanged)

---

## What It Took

### Environment Issues (Most of the Session)
Getting the environment stable was the hardest part:
- SDK 56 and 55 were incompatible with the physical device's Expo Go app (max SDK 54)
- Multiple fresh project scaffolds were required due to mixed SDK version conflicts
- `--legacy-peer-deps` was required for most installs due to peer dependency conflicts
- `react-native-screens` had to be pinned to `4.4.0` (newer versions require react-native >= 0.82, SDK 54 ships with 0.81.5)
- `expo-constants`, `expo-linking`, `react-native-safe-area-context`, `react-native-gesture-handler`, and `react-native-screens` all had to be installed manually as expo-router peer dependencies

### API URL
- Web used `import.meta.env.VITE_API_URL`
- Mobile uses `process.env.EXPO_PUBLIC_API_URL`
- `localhost` does not work on a physical device — must use the machine's local network IPv4 address (found via `ipconfig`)
- `.env` file lives in the mobile project root

### Auth
- Old token from a previous mobile project was still in SecureStore on the device — caused confusion early on
- Auth gate lives in `src/app/_layout.tsx` and checks SecureStore on every route change

---

## Project Structure

```
src/app/
├── _layout.tsx              ← Auth gate + QueryClientProvider
├── login.tsx
├── signup.tsx               ← Also handles profile edit (isEdit param)
├── (tabs)/
│   ├── _layout.tsx          ← Bottom tab bar (Calendar, Groups, Profile)
│   ├── index.tsx            ← Main calendar view
│   ├── groups.tsx
│   └── profile.tsx
├── group/
│   └── [id].tsx
├── event/
│   └── [id].tsx
├── new-group.tsx
└── new-event.tsx

src/constants/               ← Copied directly from web project (no changes needed)
├── Event.ts
├── GatheringGroup.ts
├── GroupUser.ts
└── enums/
    ├── InviteStatus.ts
    ├── Repetition.ts
    ├── Role.ts
    └── Rsvp.ts
```

---

## Where We Are

### Working
- Auth flow end to end (login, signup, token storage, auth gate redirect)
- Bottom tab navigation (Calendar, Groups, Profile)
- All screens converted and rendering
- API communication over local network
- Calendar with event dots and date selection on the main screen

### Not Yet Tested With Real Data
- Group detail page (member management, invite flow, role changes)
- Event detail page (RSVP, guest list, edit flow)
- New Group form
- New Event form
- Profile edit (routes through signup with `isEdit` param)

### Known Gaps
- **No token validation against the API on startup** — the auth gate only checks that a token *exists* in SecureStore, not that it is still valid. An expired or invalid token will pass the gate and fail silently on data fetches.
- **No logout button** on the profile screen
- Minor UI details to polish (self-identified, low priority)

---

## What's Next

### Session Priority: `/profile` API Endpoint
Build a `GET /profile` endpoint on the API that:
- Requires a valid Bearer token in the Authorization header
- Validates the token against the JWT secret
- Returns the current user's data on success
- Returns 401 on invalid or expired token

Then wire it up in `src/app/_layout.tsx`:
- On app startup, after reading the token from SecureStore, make a request to `GET /profile`
- If 401 is returned → clear the token and redirect to login
- If successful → optionally refresh the stored user object in SecureStore

### After That
- Add a logout button to the profile screen (clears token + user from SecureStore, redirects to login)
- End-to-end testing of each screen with real data
- UI polish pass