# Lessons Learned - WannaBet Development

## Loading Screen / SDK Provider Issues

### The Problem

**Symptom:** App gets stuck on loading screen indefinitely

**Root Cause:** The Farcaster SDK's `sdk.context` is a Promise that may never resolve in standalone/browser mode, causing the app to hang forever.

### What I Keep Getting Wrong

1. **Trying to be clever with SDK detection**
   - I keep trying to check `if (context.client)` or similar
   - The real issue is that `sdk.context` itself hangs, not what it returns
   - Any attempt to `await sdk.context` in standalone mode = infinite hang

2. **Promise.race isn't enough if the SDK Promise hangs**
   - Promise.race works if both promises eventually resolve
   - But if `sdk.context` truly hangs (doesn't resolve OR reject), race doesn't help

3. **Overcomplicating the solution**
   - The fix should be simple: just set a hard timeout

### The Correct Pattern

```typescript
useEffect(() => {
  // Simple: just wait 1 second then show the app
  const timer = setTimeout(() => {
    setIsReady(true)
  }, 1000)

  // Try to init SDK in parallel (best effort)
  sdk.context
    .then((context) => {
      if (context.client) {
        sdk.actions.ready()
        console.log('✓ Farcaster SDK initialized')
      } else {
        console.log('ℹ Standalone mode')
      }
    })
    .catch((err) => {
      console.log('SDK init failed:', err)
    })

  return () => clearTimeout(timer)
}, [])
```

**Key principle:** Always have a guaranteed timeout that shows the app, regardless of SDK state.

### Why This Keeps Happening

1. **I focus on the wrong problem** - I try to "properly detect" Farcaster vs standalone, when I should just focus on "never hang"
2. **I test logic, not behavior** - The code "looks right" but doesn't actually work in the browser
3. **I forget the user experience** - 1 second load = good, infinite load = broken

### The Rule

**NEVER `await` anything from the Farcaster SDK without a hard timeout that bypasses it entirely.**

The loading screen should ALWAYS show the app after max 1 second, no matter what.

---

## Other Common Mistakes

### TypeScript `any` in Production

- ESLint will fail builds with `(context as any).client`
- Use proper type narrowing: `typeof x === 'object' && 'prop' in x`
- Or just accept the SDK might fail and use try/catch

### Unescaped Apostrophes in JSX

- `don't` → `don&apos;t`
- Linter catches this in build

### Not Testing in Browser

- Build succeeds ≠ app works
- Always test the actual UX after making loading/init changes

---

## Prevention Checklist

Before pushing changes:

- [ ] Does the app show up in browser within 2 seconds?
- [ ] Build succeeds? `pnpm run build`
- [ ] No TypeScript `any` types in production code?
- [ ] Loading states have hard timeouts?
- [ ] All async SDK calls have fallbacks?
