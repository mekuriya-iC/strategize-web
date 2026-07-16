# Quick Network Switching Guide

## Current Configuration: LOCALHOST

Your app is now running in **localhost mode** - perfect for local development.

- Frontend: http://localhost:3001
- Backend: http://localhost:3000/graphql

---

## Switch Between Modes

### 🏠 Switch to Localhost Mode (Current)
```bash
./switch-to-localhost.sh
```
Then restart frontend: `npm run dev`

### 🌐 Switch to Network Mode (For Sharing)
```bash
./switch-to-network.sh
```
Then restart frontend: `npm run dev`

Share with testers: `http://192.168.137.2:3001`

---

## When to Use Each Mode

### Localhost Mode (Default)
- ✅ Daily development work
- ✅ Testing on your own machine
- ✅ Fastest performance
- ✅ No network issues

### Network Mode
- ✅ Sharing with QA testers on same WiFi
- ✅ Testing on mobile devices
- ✅ Demonstrating to stakeholders
- ✅ Cross-device testing

---

## Important Notes

⚠️ **Always restart your frontend after switching modes**
```bash
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

💡 **Backend is already configured** to work in both modes (listens on `0.0.0.0`)

🔒 **Security**: Network mode exposes your dev server to anyone on your WiFi. Only use during testing.

---

## Troubleshooting

### Can't access from other devices?
1. Make sure you switched to network mode: `./switch-to-network.sh`
2. Restart your frontend server
3. Check your firewall settings
4. Verify both devices are on the same WiFi

### Backend not working after switch?
1. Backend doesn't need to be restarted
2. Make sure it's running: `cd strategize_api && npm run start:dev`
3. Test: `curl http://localhost:3000/graphql`

### Lost your localhost config?
Just run `./switch-to-localhost.sh` - it will recreate it!
