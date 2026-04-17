# 🗺️ Roadmap — Yoni Bot

**Vision**: כלי פיננסים אמיתי שעובד טוב, בעברית, מקומי ובטוח.

---

## שלב 1: Foundation (עכשיו → שבועות 1-2)

### המטרה
אתה מבין את הפרוייקט + יש לך setup בעבודה

### Deliverables
- ✍️ **Hebrew Documentation** (README, STATUS, ROADMAP, FAQ, SETUP)
- 📊 **Status Assessment** (what works, what doesn't)
- 🚀 **Local Setup** (npm run dev בעבודה)
- 🎯 **Clear Direction** (מה בא הלאה?)

### Success Criteria
- [ ] You can run `npm run dev` without issues
- [ ] You understand what each app does
- [ ] You know what's working and what's not
- [ ] You can message the bot and it responds
- [ ] Dashboard loads without errors

---

## שלב 2: Clean It Up (שבועות 3-4)

### המטרה
הכל עובד טוב, בלי bugs משמעותיים

### Focus Areas

#### 🤖 Bot Improvements
- Make commands more intuitive
- Add `/status` — quick overview
- Add `/recent` — last 10 transactions
- Better error messages
- `/help` should show examples

#### 🌐 Dashboard Improvements
- Better layout (currently basic)
- Show recent transactions
- Display bot status
- Responsive design
- Clean up components

#### 🧪 Testing
- Add unit tests for crypto utils
- Add integration tests for API routes
- Aim for 50%+ coverage (realistic goal)

#### 📚 Documentation
- Document all API endpoints
- Document bot commands
- Document database schema
- Add code comments where needed

### Success Criteria
- [ ] No critical bugs
- [ ] Bot UX is intuitive
- [ ] Dashboard is usable
- [ ] 30+ basic tests pass
- [ ] Documentation is complete

---

## שלב 3: Features (חודשים 2-3)

### המטרה
Implement features that actually help you

### Potential Features (בסדר עדיפויות)

#### High Value
1. **Transaction Categorization**
   - Auto-categorize based on description
   - Manual category override
   - Bot: `/category [category]`

2. **Budget Tracking**
   - Set monthly budgets per category
   - Warning when approaching limit
   - Bot notifications

3. **Monthly Reports**
   - Spending by category
   - Month-to-month comparison
   - Bot: `/report`

#### Medium Value
4. **Export to Spreadsheet**
   - Export transactions as CSV
   - Dashboard button + API endpoint

5. **Better Analytics**
   - Charts on dashboard
   - Trends (spending increasing/decreasing?)
   - Insights ("You spent 15% more on food this month")

6. **Recurring Transactions**
   - Mark transactions as recurring
   - Predict next month spending

#### Low Value (Later)
7. **Goals Tracking**
   - Save for something
   - Track progress
8. **Multi-user Support**
   - Share finances with spouse/family
   - (Complex — later)

### Success Criteria
- [ ] At least 3 features implemented
- [ ] Each feature has tests
- [ ] Dashboard UI improved significantly
- [ ] Test coverage 60%+

---

## שלב 4: Scale (חודשים 4+)

### אם נצליח בשלבים 1-3...

- 🔐 **Security Hardening**
  - Password strength requirements
  - Rate limiting on API
  - Better error messages (don't leak info)

- 📱 **Mobile Bot**
  - Better mobile UX for dashboard
  - (Mobile app — probably not needed)

- 🔔 **Notifications**
  - Daily summary via bot
  - Alert on large transactions
  - Configurable preferences

- 🌍 **Multi-Bank Support**
  - More Israeli banks
  - Better scraper reliability
  - (Or: manual import)

- 🏦 **Bank Integration Ideas**
  - Direct bank APIs (if available)
  - CSV import
  - Manual entry with mobile photo

---

## Timeline & Realistic Expectations

### שלב 1: 1-2 שבועות
- **Effort**: Medium (documentation heavy)
- **Complexity**: Low (mostly writing)

### שלב 2: 2-3 שבועות
- **Effort**: Medium-High (code + tests)
- **Complexity**: Medium

### שלב 3: 4-6 שבועות
- **Effort**: High (new features)
- **Complexity**: High

### שלב 4: Open-ended
- **Effort**: As needed
- **Complexity**: Varies

**Total realistic timeline: 3 months** for a solid personal tool.

---

## Open Questions (תלוי בך!)

### Priority Questions
1. **Is local-only forever?** Or eventually cloud?
2. **Family sharing?** Or just you?
3. **Which feature first?** (Categorization? Budget? Reports?)
4. **How much time per week?** (Hobby vs focused?)
5. **What's the success metric?** (When is it "good enough"?)

### Technical Questions
1. **Scraper reliability** — worth improving? Or switch to manual import?
2. **Bot vs Dashboard** — which matters more?
3. **Mobile** — important eventually?
4. **Backup strategy** — automated or manual?

---

## How This Changes

This roadmap **is not final**.

It will change based on:
- What actually works vs what doesn't
- Bugs you find
- Features you realize you need
- Feedback from using it

**Revisit monthly** and adjust.

---

## 🎯 Core Principles

Whatever we build, it must be:

✅ **Simple** — No unnecessary complexity  
✅ **Reliable** — Works consistently  
✅ **Secure** — Your data stays private  
✅ **Understandable** — You can modify it  
✅ **Useful** — Actually helps you manage money  

---

## 📝 Track Progress

As we go, mark progress:

| Milestone | Target | Status |
|-----------|--------|--------|
| Phase 1: Foundation | 2 weeks | ⏳ In Progress |
| Phase 2: Clean | 4 weeks | ⏳ Next |
| Phase 3: Features | 6 weeks | 📅 Planned |
| Phase 4: Scale | ? | 📅 Maybe |

---

## Questions?

- "What should I build first?" → Finish Phase 1, then decide
- "Can I skip tests?" → No, but can start small
- "Is this too ambitious?" → No, it's realistic
- "Can I help?" → Yes, suggest features/bugs in docs/_issues

---

**Last Updated**: April 2026  
**Phase**: 1 — Foundation  

