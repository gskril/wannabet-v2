# Template Builder Design - Multi-Step Bet Creation

## Overview

Redesigned bet creation to use structured inputs instead of free text, with smart user search featuring avatars.

---

## Step 1: Who's Involved? 👥

### User Search Component with Avatars

**Features:**

- Search by @username or FID
- Live dropdown showing top 5 matching users
- Avatar thumbnails for visual recognition
- Selected user confirmation chip below input
- Auto-excludes already selected users (judge can't be taker)

**Mock Users in Dropdown:**

1. **Dan Romero** (@dwr, FID: 3) - Building Farcaster
2. **Varun Srinivasan** (@v, FID: 2) - Protocol engineer
3. **Ted** (@ted, FID: 6841) - Crypto enthusiast
4. **Alice** (@alice, FID: 1234) - DeFi lover
5. **Bob the Builder** (@bob, FID: 5678) - Always betting on Web3

**Two Fields:**

- **Who are you betting?** (optional) - with user search
- **Who should judge?** (required) - with user search

---

## Step 2: How Much? 💰

### USDC Amount Input

- Large, prominent input with USDC coin icon on left
- Space reserved for future token icons (ETH, etc.)
- Mobile-optimized with large touch targets (h-16)
- Helper text: "Both you and your opponent will put up this amount"

---

## Step 3: When Does It End? 📅

### Quick Date Selection

Two large, mobile-friendly button chips:

- **1 Day** - Sets expiry to tomorrow
- **7 Days** - Sets expiry to one week out

Shows formatted date below:

```
Bet ends on: Mon, Oct 19, 2025
```

Custom date picker deferred to Phase 2.

---

## Step 4: What's the Bet? 📝

### Template Builder (Structured Input)

Instead of free text, users build bets from two parts:

#### 1. Subject (Who?)

**Contextual Buttons with Avatars:**

**Side-by-side layout (2 columns):**

- **[Avatar] Maker's Name** - Compact button with avatar (left)
- **[Avatar] Opponent's Name** - Compact button with avatar (right, only if opponent selected)

**Separate custom option (full width, dashed border):**

- **"Or someone else..."** - No avatar, text-only, visually distinct with dashed border

Each option shows the actual user's avatar and name, pulling from the data entered in Step 1. No generic "You" or "Me" - just real names and faces. Buttons are smaller (p-2) for better mobile UX.

#### 2. Action (What will happen?)

**Text Input with Suggestions:**

Common actions dropdown when focused (no typing needed):

- run a marathon
- lose 10 lbs
- complete a project
- read 3 books
- go to the gym 5 times
- wake up before 6am every day
- cook dinner 4 times
- finish a side project
- ship a new feature
- get 1000 new followers

User can also type custom action.

### Live Preview Box

Shows the constructed bet in real-time with the selected date.

**Only appears when user engages** - no preview until subject or action is selected.

**Template fields are visually distinct:**

- Muted color text
- Dotted underline
- Static text ("will", "by") in normal weight

Example preview:

```
[Slobo] will [run a marathon] by [Mon, Oct 25, 2025]
```

(Where bracketed items are muted/underlined)

Or if Alice was selected as subject:

```
[Alice] will [lose 10 lbs] by [Sun, Oct 19, 2025]
```

Visual design:

- Dashed border with primary color
- Light background highlight
- Template fields: `text-muted-foreground underline decoration-dotted`
- Updates as user types each field and includes the date from Step 3

---

## Key Improvements

### 1. **Structured Beats Free Text**

- Forces clear, parseable bet descriptions
- Easier for judges to understand
- Consistent format across all bets
- Reduces ambiguity and disputes

### 2. **Less Typing, More Clicking**

- Subject: 2-3 buttons with avatars + optional custom
- Action: 10 common suggestions + custom
- Dates: 2 button clicks (moved to Step 3)
- No free text "condition" field - date provides the timeline

### 3. **Visual User Selection**

- Avatars with real names make people feel tangible
- No generic "You" or "Me" - actual identities
- Easier to recognize users at a glance
- Reduces mistakes (selecting wrong user)
- Better mobile UX with large touch targets

### 4. **Smart Validation**

- Can't pick same person for multiple roles
- Shows selected users with confirmation
- Preview only appears on engagement (no preselection)
- Template fields visually distinct in preview
- Step-by-step validation prevents bad data

### 5. **Compact, Mobile-First Layout**

- Subject buttons are smaller (p-2 instead of p-3)
- Side-by-side layout for main options
- Custom option visually distinct with dashed border
- Easy thumb reach on mobile devices

---

## Component Architecture

### New Components Created

1. **UserSearch** (`/components/user-search.tsx`)
   - Reusable user search with avatars
   - Props: label, placeholder, required, value, onChange, excludeFids
   - Shows dropdown with 5 users
   - Visual confirmation of selection

2. **Updated CreateBetDialog** (`/components/create-bet-dialog.tsx`)
   - Uses UserSearch for Step 1
   - Template builder for Step 3
   - Constructs full description from parts: `${subject} will ${action} ${condition}`

---

## Example Bet Flow

**Step 1:**

- Search and select @alice as opponent (see avatar)
- Search and select @dwr as judge (see avatar, @alice excluded from list)

**Step 2:**

- Enter: `100` USDC

**Step 3:**

- Click: `7 Days`
- Confirms: **Bet ends on: Mon, Oct 25, 2025**

**Step 4:**

- See: Slobo's avatar and Alice's avatar side-by-side, "Or someone else..." below
- Click: Slobo's avatar (maker)
- Preview appears (no preview shown before engagement)
- Click suggestion: `run a marathon`
- Preview updates: **"[Slobo] will [run a marathon] by [Mon, Oct 25, 2025]"**
  (with muted, dotted underlines on template fields)

**Submit!**

---

## Mobile-First Design

All inputs optimized for mobile:

- Minimum 44px touch targets (Apple guidelines)
- Large buttons (h-12 for navigation, h-16 for amount)
- Easy-to-tap avatar rows (h-[60px])
- Large font sizes (text-base minimum)
- Spaced out UI elements (gap-3, gap-4)
- Fixed create button (bottom-right, z-50)

---

## Future Enhancements (Phase 2)

- Custom date picker
- Ethereum address support for judge
- Full Farcaster username search API
- More action suggestions categorized by type (fitness, work, personal)
- Saved bet templates
- Multi-language support
- Optional "qualifier" field (e.g., "in under 5 hours") for more specific bets
