/**
 * prisma/seed.ts — idempotent seed (safe to re-run)
 * Run: npm run db:seed  OR  npx prisma db seed
 */
import { PrismaClient, Role, TripStatus, AnnouncementType, NotificationType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding…')

  // ── Clear all data (FK-ordered) ─────────────────────────────────────────
  await prisma.notification.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.gearCheckout.deleteMany()
  await prisma.gearItem.deleteMany()
  await prisma.tripGearItem.deleteMany()
  await prisma.waitlistEntry.deleteMany()
  await prisma.tripSignup.deleteMany()
  await prisma.trip.deleteMany()
  await prisma.user.deleteMany()

  // ── Helpers ──────────────────────────────────────────────────────────────
  const d = (offsetDays: number, offsetHours = 0) =>
    new Date(Date.now() + offsetDays * 86_400_000 + offsetHours * 3_600_000)

  // ── Users ────────────────────────────────────────────────────────────────
  const alice = await prisma.user.create({
    data: {
      id: 'user_alice',
      email: 'alice@example.com',
      fullName: 'Alice Chen',
      phone: '555-0101',
      emergencyName: 'Bob Chen',
      emergencyPhone: '555-0102',
      fieldStudiesId: 'FSC-001',
      bio: 'Club admin and avid backpacker. Have hiked every major trail in the Sierra Nevada.',
      role: Role.ADMIN,
    },
  })

  const ben = await prisma.user.create({
    data: {
      id: 'user_ben',
      email: 'ben@example.com',
      fullName: 'Ben Torres',
      phone: '555-0201',
      emergencyName: 'Maria Torres',
      emergencyPhone: '555-0202',
      fieldStudiesId: 'FSC-002',
      bio: 'Trip Lead specializing in mountaineering and desert routes. 3× summit of Mt. Whitney.',
      role: Role.TRIP_LEAD,
    },
  })

  const clara = await prisma.user.create({
    data: {
      id: 'user_clara',
      email: 'clara@example.com',
      fullName: 'Clara Williams',
      phone: '555-0301',
      fieldStudiesId: 'FSC-003',
      bio: 'Trip Lead for overnight and multi-day adventures. Wilderness First Responder certified.',
      role: Role.TRIP_LEAD,
    },
  })

  const dave = await prisma.user.create({
    data: {
      id: 'user_dave',
      email: 'dave@example.com',
      fullName: 'Dave Park',
      fieldStudiesId: 'FSC-004',
      role: Role.MEMBER,
    },
  })

  console.log('  ✓ Users')

  // ── Trips ────────────────────────────────────────────────────────────────
  // Trip 1 — small capacity to demo the waitlist flow
  const trip1 = await prisma.trip.create({
    data: {
      title: 'Crystal Lake Day Hike',
      location: 'Crystal Lake, Sierra Nevada',
      description:
        "A beautiful day hike to Crystal Lake with stunning views of the surrounding peaks. Perfect for beginners and families. We'll stop for lunch at the lake before heading back. Bring sunscreen and plenty of water.",
      startAt: d(7),
      endAt: d(7, 8),
      capacity: 2, // small so waitlist is pre-populated
      priceCents: 1500,
      status: TripStatus.OPEN,
      difficulty: 'Easy',
      mileage: 5.2,
      tripLeadId: ben.id,
      slackChannelUrl: 'https://slack.com/app_redirect?channel=crystal-lake-hike',
      foodProvided: false,
      venmoHandle: '@FieldStudiesClub',
    },
  })

  const trip2 = await prisma.trip.create({
    data: {
      title: 'Mount Baldy Summit',
      location: 'San Gabriel Mountains, CA',
      description:
        'Challenging summit attempt to the highest peak in the San Gabriel Mountains. Stunning 360° views reward the effort. Bring warm layers — it gets cold near the top even in summer.',
      startAt: d(14),
      endAt: d(14, 10),
      capacity: 8,
      priceCents: 2500,
      status: TripStatus.OPEN,
      difficulty: 'Strenuous',
      mileage: 9.0,
      tripLeadId: ben.id,
      slackChannelUrl: 'https://slack.com/app_redirect?channel=baldy-summit',
      foodProvided: false,
      venmoHandle: '@FieldStudiesClub',
    },
  })

  const trip3 = await prisma.trip.create({
    data: {
      title: 'Coastal Redwoods Overnight',
      location: 'Humboldt Redwoods State Park',
      description:
        "Two-day backpacking trip through ancient coastal redwoods. We'll set up camp near Bull Creek and explore old-growth forest. Club tents and bear canisters available. Dinner provided on night 1.",
      startAt: d(21),
      endAt: d(22, 12),
      capacity: 6,
      priceCents: 7500,
      status: TripStatus.OPEN,
      difficulty: 'Moderate',
      mileage: 14.0,
      tripLeadId: clara.id,
      slackChannelUrl: 'https://slack.com/app_redirect?channel=redwoods-overnight',
      foodProvided: true,
      venmoHandle: '@FieldStudiesClub',
    },
  })

  const trip4 = await prisma.trip.create({
    data: {
      title: 'Joshua Tree Bouldering Weekend',
      location: 'Joshua Tree National Park',
      description:
        "Weekend bouldering trip in Joshua Tree. All skill levels welcome — we'll split into groups by experience. Camping at Hidden Valley campground. Shoes can be borrowed from the gear library.",
      startAt: d(30),
      endAt: d(32),
      capacity: 10,
      priceCents: 5000,
      status: TripStatus.DRAFT,
      difficulty: 'Moderate',
      mileage: 3.0,
      tripLeadId: clara.id,
      venmoHandle: '@FieldStudiesClub',
    },
  })

  // Past trip (for My Trips "past" section)
  const tripPast = await prisma.trip.create({
    data: {
      title: 'Tahoe Basin Backpack',
      location: 'Lake Tahoe, NV/CA',
      description:
        '3-day loop through the Tahoe basin with spectacular lake views. Covered 28 miles total.',
      startAt: d(-30),
      endAt: d(-27),
      capacity: 8,
      priceCents: 9500,
      status: TripStatus.CLOSED,
      difficulty: 'Strenuous',
      mileage: 28.0,
      tripLeadId: ben.id,
    },
  })

  console.log('  ✓ Trips')

  // ── Trip gear lists ──────────────────────────────────────────────────────
  await prisma.tripGearItem.createMany({
    data: [
      // Crystal Lake (easy day hike)
      { tripId: trip1.id, name: 'Water (2L minimum)', provided: false },
      { tripId: trip1.id, name: 'Trail snacks / lunch', provided: false },
      { tripId: trip1.id, name: 'Sunscreen + sunglasses', provided: false },
      { tripId: trip1.id, name: 'Rain jacket (just in case)', provided: false },
      { tripId: trip1.id, name: 'Trekking poles', provided: true },

      // Mount Baldy (strenuous summit)
      { tripId: trip2.id, name: 'Warm layers / fleece', provided: false },
      { tripId: trip2.id, name: 'Gloves + beanie', provided: false },
      { tripId: trip2.id, name: 'Microspikes (if snow present)', provided: false },
      { tripId: trip2.id, name: 'Trekking poles', provided: true },
      { tripId: trip2.id, name: 'Headlamp', provided: true },
      { tripId: trip2.id, name: '3L water + snacks', provided: false },

      // Redwoods overnight
      { tripId: trip3.id, name: '2-person tent', provided: true },
      { tripId: trip3.id, name: 'Sleeping bag (20°F)', provided: true },
      { tripId: trip3.id, name: 'Bear canister', provided: true },
      { tripId: trip3.id, name: 'Camp stove + fuel', provided: true },
      { tripId: trip3.id, name: 'Rain jacket + rain pants', provided: false },
      { tripId: trip3.id, name: 'Trekking poles', provided: false },
      { tripId: trip3.id, name: 'Headlamp', provided: false },
    ],
  })

  console.log('  ✓ Trip gear lists')

  // ── Signups — fill trip1 to capacity to demo waitlist ────────────────────
  await prisma.tripSignup.createMany({
    data: [
      { userId: alice.id, tripId: trip1.id },
      { userId: ben.id, tripId: trip1.id },
    ],
  })
  await prisma.trip.update({ where: { id: trip1.id }, data: { status: TripStatus.FULL } })

  await prisma.waitlistEntry.create({
    data: { userId: clara.id, tripId: trip1.id, position: 1 },
  })

  await prisma.tripSignup.createMany({
    data: [
      { userId: ben.id, tripId: trip2.id },
      { userId: clara.id, tripId: trip3.id },
      // Past trip signups
      { userId: alice.id, tripId: tripPast.id },
      { userId: ben.id, tripId: tripPast.id },
      { userId: dave.id, tripId: tripPast.id },
    ],
  })

  console.log('  ✓ Signups + waitlist')

  // ── Gear items ───────────────────────────────────────────────────────────
  const tent = await prisma.gearItem.create({
    data: { name: '2-Person Tent', quantityTotal: 5, quantityAvailable: 3 },
  })
  const headlamp = await prisma.gearItem.create({
    data: { name: 'Headlamp', quantityTotal: 10, quantityAvailable: 7 },
  })
  const sleepingBag = await prisma.gearItem.create({
    data: { name: 'Sleeping Bag (20°F)', quantityTotal: 8, quantityAvailable: 5 },
  })
  const trekPoles = await prisma.gearItem.create({
    data: { name: 'Trekking Poles (pair)', quantityTotal: 6, quantityAvailable: 6 },
  })
  const bearCanister = await prisma.gearItem.create({
    data: { name: 'Bear Canister', quantityTotal: 4, quantityAvailable: 2 },
  })
  const stove = await prisma.gearItem.create({
    data: { name: 'Camp Stove + Fuel', quantityTotal: 3, quantityAvailable: 3 },
  })
  const filterBag = await prisma.gearItem.create({
    data: { name: 'Water Filter', quantityTotal: 4, quantityAvailable: 4 },
  })

  console.log('  ✓ Gear items')

  await prisma.gearCheckout.createMany({
    data: [
      { userId: alice.id, gearItemId: tent.id, quantity: 1, dueAt: d(3) },
      { userId: alice.id, gearItemId: headlamp.id, quantity: 2, dueAt: d(3) },
      { userId: ben.id, gearItemId: tent.id, quantity: 1, dueAt: d(15) },
      { userId: ben.id, gearItemId: sleepingBag.id, quantity: 1, dueAt: d(15) },
      { userId: dave.id, gearItemId: bearCanister.id, quantity: 2, dueAt: d(10) },
    ],
  })

  // ── Announcements ────────────────────────────────────────────────────────
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Welcome to Spring Semester 2026!',
        body: "Welcome back, everyone! We have an incredible semester lined up — 8+ trips ranging from easy day hikes to multi-day backpacking adventures. New this year: we're expanding the gear library with 5 new tents and additional sleeping bags. Check out our upcoming trips and sign up early — spots fill fast. Join our Slack workspace to stay connected with trip updates and trip leads.",
        type: AnnouncementType.CLUB,
        authorId: alice.id,
      },
      {
        title: 'Crystal Lake Day Hike — Almost Full!',
        body: "Our Crystal Lake Day Hike is almost at capacity! There's only 1 spot remaining. If you've been on the fence, now is the time to sign up. Waitlist spots are also available. Ben will be leading this one — it's a perfect beginner-friendly trip with stunning lake views.",
        type: AnnouncementType.TRIP,
        tripId: trip1.id,
        authorId: ben.id,
      },
      {
        title: 'Field Notes: A Week in the Cascades',
        body: "Last month's Cascades backpacking trip was absolutely incredible. We covered 45 miles over 5 days, summited two peaks (including a technical scramble on day 3), and camped at 7,500 feet with the most spectacular star views you've ever seen. Six members made the full loop. Full photo album and trip report linked in Slack. Special shoutout to Dave and Clara for keeping spirits high on the final 12-mile push out.",
        type: AnnouncementType.FIELD_NOTES,
        authorId: ben.id,
      },
      {
        title: 'Gear Shed Hours — Updated',
        body: "The gear shed is now open Monday and Thursday evenings (6–8 PM) and Saturday mornings (10 AM–12 PM). All checkouts require a signed waiver on file. Please return all gear clean and dry — a $10 cleaning fee applies to returned muddy tents. Lost or damaged gear is charged at replacement cost. Questions? Message Alice on Slack.",
        type: AnnouncementType.ADMIN,
        authorId: alice.id,
      },
      {
        title: "What to Expect: Mount Baldy Summit",
        body: "With our Baldy summit attempt coming up, here's everything you need to know. Carpool departs at 5:30 AM sharp from the Union parking structure. Dress in layers — expect temperatures 20°F colder at the summit than at the trailhead. Trekking poles are strongly recommended (a few are available in the gear shed, first come first served). Bring 3L of water and high-energy snacks. We'll regroup at the saddle before the final push to the summit.",
        type: AnnouncementType.TRIP,
        tripId: trip2.id,
        authorId: ben.id,
      },
    ],
  })

  console.log('  ✓ Announcements')

  // ── Notifications (per-user) ──────────────────────────────────────────────
  const notifData = [
    // Alice
    {
      userId: alice.id, type: NotificationType.ACTION_ITEM,
      title: 'Emergency contact needed',
      body: 'Please add an emergency contact to your profile before your next trip.',
      linkUrl: '/profile',
    },
    {
      userId: alice.id, type: NotificationType.ANNOUNCEMENT,
      title: 'Gear shed hours updated',
      body: 'New hours: Mon/Thu 6–8 PM, Sat 10 AM–12 PM.',
      read: true, linkUrl: '/announcements',
    },
    // Ben
    {
      userId: ben.id, type: NotificationType.TRIP_UPDATE,
      title: "You're leading Crystal Lake Hike",
      body: "You've been assigned as trip lead. The trip is now full — 2 members confirmed.",
      linkUrl: `/trips/${trip1.id}`,
    },
    {
      userId: ben.id, type: NotificationType.GEAR_REMINDER,
      title: 'Gear due back soon',
      body: 'Your tent checkout is due back in 3 days.',
      linkUrl: '/gear',
    },
    // Clara
    {
      userId: clara.id, type: NotificationType.GEAR_REMINDER,
      title: 'Headlamp due in 3 days',
      body: 'Your headlamp checkout is due back soon. Please return to the gear shed.',
      linkUrl: '/gear',
    },
    {
      userId: clara.id, type: NotificationType.TRIP_UPDATE,
      title: "You're #1 on the Crystal Lake waitlist",
      body: "You've been added to the waitlist. We'll notify you if a spot opens up.",
      linkUrl: `/trips/${trip1.id}`,
    },
    {
      userId: clara.id, type: NotificationType.ACTION_ITEM,
      title: 'Complete trip waiver',
      body: 'Please fill out the liability waiver before the Redwoods Overnight trip.',
      linkUrl: '/profile',
    },
    // Dave
    {
      userId: dave.id, type: NotificationType.NEW_TRIP,
      title: 'New trip posted: Joshua Tree',
      body: 'Joshua Tree Bouldering Weekend has been announced. Signup opens soon.',
      linkUrl: `/trips/${trip4.id}`,
    },
    {
      userId: dave.id, type: NotificationType.ANNOUNCEMENT,
      title: 'Welcome to Spring 2026!',
      body: 'New semester, new adventures. Check out upcoming trips.',
      read: true, linkUrl: '/announcements',
    },
  ]

  await prisma.notification.createMany({ data: notifData })

  console.log('  ✓ Notifications')
  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
