export type MessageContext = 'greeting' | 'question' | 'response' | 'announcement' | 'casual' | 'farewell'
  | 'weather' | 'sports' | 'music' | 'movies' | 'food'

export interface MessageTemplate {
  context: MessageContext
  text: string
  requiresResponse?: boolean
}

export const messagePool: MessageTemplate[] = [
  { context: 'greeting', text: 'Hey everyone!', requiresResponse: true },
  { context: 'greeting', text: 'Good morning!', requiresResponse: true },
  { context: 'greeting', text: 'Hi there! I hope everyone is having a fantastic start to their day and feeling energized to tackle all the goals we have set for this week!', requiresResponse: true },
  { context: 'greeting', text: "What's up?", requiresResponse: true },
  { context: 'greeting', text: 'Hello!', requiresResponse: true },
  { context: 'greeting', text: 'Anyone tried the new features yet? I am particularly curious about the updated dashboard performance and if the navigation feels smoother than the previous version.', requiresResponse: true },

  { context: 'question', text: 'Has anyone seen the latest update?', requiresResponse: true },
  { context: 'question', text: 'Quick question - how do I get started?', requiresResponse: true },
  { context: 'question', text: 'Can someone help me understand this? I have been looking through the documentation for hours but the integration steps for the API are still a bit confusing to me.', requiresResponse: true },
  { context: 'question', text: 'What do you all think about this approach?', requiresResponse: true },
  { context: 'question', text: 'Anyone free for a quick sync?', requiresResponse: true },
  { context: 'question', text: 'Does this make sense to everyone? I want to ensure that our architectural decisions align with the long-term scalability requirements we discussed during the last planning session.', requiresResponse: true },

  { context: 'response', text: 'That makes sense!', requiresResponse: false },
  { context: 'response', text: 'Thanks for explaining!', requiresResponse: false },
  { context: 'response', text: 'Got it, appreciate the help! It is always great to have someone break down these complex topics into manageable pieces that are much easier to digest and implement.', requiresResponse: false },
  { context: 'response', text: 'Interesting approach!', requiresResponse: false },
  { context: 'response', text: 'I agree with that', requiresResponse: false },
  { context: 'response', text: "I'm not sure I follow. Could you perhaps provide a few more concrete examples or a step-by-step walkthrough so I can visualize how this would work in a real-world scenario?", requiresResponse: false },
  { context: 'response', text: "Yeah, I've had the same issue", requiresResponse: false },
  { context: 'response', text: 'Let me try that and get back to you', requiresResponse: false },
  { context: 'response', text: 'Works for me! I will go ahead and update my local environment settings to reflect these changes and let you know if I run into any unexpected bugs or conflicts.', requiresResponse: false },
  { context: 'response', text: "I'm on it", requiresResponse: false },

  { context: 'announcement', text: 'Just pushed a new update', requiresResponse: false },
  { context: 'announcement', text: 'FYI - maintenance scheduled for tonight starting at midnight. Please make sure to save all your active work and log out of the system to prevent any potential data loss or sync errors.', requiresResponse: false },
  { context: 'announcement', text: 'Heads up: server restart in 5 mins', requiresResponse: false },
  { context: 'announcement', text: 'New docs are live!', requiresResponse: false },
  { context: 'announcement', text: 'Updated the roadmap, check it out! We have added several new milestones for the upcoming quarter, including the mobile app beta release and the full migration to our new cloud infrastructure.', requiresResponse: false },

  { context: 'casual', text: 'Welcome everyone, glad to have you all here.', requiresResponse: false },
  { context: 'casual', text: 'Feel free to chat about anything in this room.', requiresResponse: false },
  { context: 'casual', text: 'This is the main hangout spot, make yourselves at home. Grab a virtual coffee, pull up a chair, and feel free to share whatever is on your mind today with the rest of the group.', requiresResponse: false },
  { context: 'casual', text: 'Great work everyone!', requiresResponse: false },
  { context: 'casual', text: 'This is looking really good', requiresResponse: false },
  { context: 'casual', text: 'Nice progress today. I am genuinely impressed by how much we managed to accomplish in such a short amount of time, especially considering the technical hurdles we had to overcome.', requiresResponse: false },
  { context: 'casual', text: "I'm really enjoying this project", requiresResponse: false },
  { context: 'casual', text: 'Coffee break time!', requiresResponse: false },
  { context: 'casual', text: 'Anyone else excited for the weekend? I am planning on heading out to the mountains for a bit of hiking and fresh air to clear my head after this incredibly intense sprint.', requiresResponse: true },
  { context: 'casual', text: 'This team is awesome!', requiresResponse: false },
  { context: 'casual', text: 'Just finished a marathon debugging session', requiresResponse: false },
  { context: 'casual', text: "Can't believe it's already Friday. The week has absolutely flown by with all the meetings and deadlines, and I am definitely ready to switch off and relax for a couple of days.", requiresResponse: false },
  { context: 'casual', text: 'Good vibes only in here.', requiresResponse: false },
  { context: 'casual', text: 'Happy to see so many people online.', requiresResponse: false },
  { context: 'casual', text: 'This chat is always so active, love it. It is great to see such a vibrant community where people are always willing to help each other out and share their latest findings and ideas.', requiresResponse: false },

  { context: 'farewell', text: 'Gotta run, catch you later!', requiresResponse: false },
  { context: 'farewell', text: 'See you all tomorrow!', requiresResponse: false },
  { context: 'farewell', text: 'Have a great evening! I hope you all find some time to disconnect from your screens and enjoy a nice dinner or a good book before getting some well-deserved rest tonight.', requiresResponse: false },
  { context: 'farewell', text: 'Signing off for today', requiresResponse: false },
  { context: 'farewell', text: 'Later everyone!', requiresResponse: false },

  { context: 'weather', text: "It's been raining nonstop here all week. The clouds are so heavy and grey that it feels like the sun has completely forgotten how to shine on this part of the world lately.", requiresResponse: false },
  { context: 'weather', text: 'Sunny and 75 degrees, perfect day to be outside.', requiresResponse: false },
  { context: 'weather', text: 'Anyone else tracking that storm system moving east?', requiresResponse: true },
  { context: 'weather', text: 'Snow forecast for this weekend, time to stock up on firewood and hot cocoa so we can stay warm and cozy while the blizzard blows outside our windows for the next forty-eight hours.', requiresResponse: false },
  { context: 'weather', text: 'The humidity is unbearable today.', requiresResponse: false },
  { context: 'weather', text: 'Finally getting some cooler weather after that heatwave.', requiresResponse: false },
  { context: 'weather', text: 'Tornado watch issued for the plains states again. Please make sure everyone in those areas has their emergency kits ready and knows exactly where the nearest storm shelter is located for safety.', requiresResponse: false },
  { context: 'weather', text: 'Love the sound of thunderstorms at night.', requiresResponse: false },
  { context: 'weather', text: 'Fog was so thick this morning I could barely see.', requiresResponse: false },
  { context: 'weather', text: 'Wind chill making it feel like -10 out there. It is the kind of cold that bites right through your coat, making even a short walk to the car feel like a dangerous trek across the arctic tundra.', requiresResponse: false },
  { context: 'weather', text: 'What is the weather like where you all are?', requiresResponse: true },
  { context: 'weather', text: 'Looks like a great week ahead, finally some sunshine.', requiresResponse: false },
  { context: 'weather', text: 'Had to scrape ice off my windshield again this morning. I am really starting to look forward to spring when I can finally stop dealing with frozen car doors and slippery driveways every single day.', requiresResponse: false },
  { context: 'weather', text: 'Spring is definitely here, allergies and all.', requiresResponse: false },
  { context: 'weather', text: 'Anyone else love watching weather radar maps?', requiresResponse: true },

  { context: 'sports', text: 'What a game last night! Did not see that comeback coming. The way they managed to turn things around in the final quarter was nothing short of a sporting miracle that fans will talk about for years.', requiresResponse: false },
  { context: 'sports', text: 'Draft picks are looking strong this year.', requiresResponse: false },
  { context: 'sports', text: "My fantasy team is having its worst season ever.", requiresResponse: false },
  { context: 'sports', text: 'Overtime finish, absolutely electric atmosphere. I could practically feel the tension through the television screen as both teams fought tooth and nail for every single point until the very last second of play.', requiresResponse: false },
  { context: 'sports', text: 'Referee calls have been terrible all season.', requiresResponse: false },
  { context: 'sports', text: 'Preseason predictions are already falling apart.', requiresResponse: false },
  { context: 'sports', text: 'That rookie is going to be something special. He has shown incredible vision and poise on the field that you normally only see from veterans who have been playing at the professional level for over a decade.', requiresResponse: false },
  { context: 'sports', text: 'Playoff race is going to be tight this year.', requiresResponse: false },
  { context: 'sports', text: 'Best rivalry matchup in years coming up this weekend.', requiresResponse: false },
  { context: 'sports', text: 'Trade deadline is going to shake things up. I expect at least two or three major stars to move to contending teams, which could completely rewrite the power rankings for the rest of the championship season.', requiresResponse: false },
  { context: 'sports', text: 'Anyone watching the match tonight?', requiresResponse: true },
  { context: 'sports', text: 'That last-minute goal was absolutely unreal.', requiresResponse: false },
  { context: 'sports', text: 'Picked up a new jersey, could not resist. The classic retro design is so much better than the modern kits, and the quality of the stitching makes it feel like it was worth every single penny I spent.', requiresResponse: false },
  { context: 'sports', text: 'Halftime show was better than the game honestly.', requiresResponse: false },
  { context: 'sports', text: 'Who is your pick for MVP this season?', requiresResponse: true },

  { context: 'music', text: 'Just discovered this amazing indie band, totally hooked. Their lead singer has such a unique vocal range and the way they blend synthesizers with acoustic folk instruments is something I have never heard before.', requiresResponse: false },
  { context: 'music', text: 'Vinyl is making such a huge comeback these days.', requiresResponse: false },
  { context: 'music', text: 'Anyone going to any concerts this summer?', requiresResponse: true },
  { context: 'music', text: 'That new album dropped and it is incredible front to back. Every track feels like it tells a different part of a larger story, and the production value is some of the cleanest I have heard in years.', requiresResponse: false },
  { context: 'music', text: 'Learning guitar, fingers are killing me but worth it.', requiresResponse: false },
  { context: 'music', text: 'Jazz or classical for late night studying?', requiresResponse: true },
  { context: 'music', text: 'Best live performance I have ever seen was last month. The energy in the venue was contagious, and the band played an encore that lasted for nearly thirty minutes, covering all of their most iconic hits.', requiresResponse: false },
  { context: 'music', text: 'Unpopular opinion: the B-sides are often better than the singles.', requiresResponse: false },
  { context: 'music', text: 'Music production tools have gotten so accessible now.', requiresResponse: false },
  { context: 'music', text: 'What genre do you all listen to while working? I usually find that instrumental lo-fi or ambient synth-wave helps me maintain a deep focus state without being distracted by complex lyrics or loud vocals.', requiresResponse: true },
  { context: 'music', text: 'Been on a lo-fi hip hop kick all week.', requiresResponse: false },
  { context: 'music', text: 'That guitar solo gave me chills.', requiresResponse: false },
  { context: 'music', text: 'Playlists for rainy days hit different. There is something about the combination of soft piano melodies and the sound of water hitting the window that makes for the perfect atmosphere for reading or napping.', requiresResponse: false },
  { context: 'music', text: 'Anyone else collect vinyl records?', requiresResponse: true },
  { context: 'music', text: 'Just learned a new song on piano, so satisfying.', requiresResponse: false },

  { context: 'movies', text: 'Just watched that new thriller, plot twist blew my mind. I spent the entire second half of the movie trying to guess the ending, but the writers managed to completely subvert all of my expectations.', requiresResponse: false },
  { context: 'movies', text: 'Classic movies hit different on a rainy evening.', requiresResponse: false },
  { context: 'movies', text: 'Marvel or DC? This debate will never end.', requiresResponse: true },
  { context: 'movies', text: 'Horror movie marathon this weekend, who is in? We are planning to watch at least five of the original slasher classics followed by some modern psychological thrillers to keep us up all night long.', requiresResponse: true },
  { context: 'movies', text: 'That director never misses, every film is a masterpiece.', requiresResponse: false },
  { context: 'movies', text: 'Subtitled films are underrated, some of the best storytelling.', requiresResponse: false },
  { context: 'movies', text: 'Rewatched the original trilogy and it still holds up perfectly. The practical effects and the depth of the world-building create an immersive experience that many modern CGI-heavy blockbusters fail to replicate.', requiresResponse: false },
  { context: 'movies', text: 'Oscar nominations were surprising this year.', requiresResponse: false },
  { context: 'movies', text: "Documentaries don't get enough love in my opinion.", requiresResponse: false },
  { context: 'movies', text: 'The soundtrack made that movie ten times better. The way the orchestral swells matched the emotional beats of the characters made every scene feel significant and deeply resonant with the audience in the theater.', requiresResponse: false },
  { context: 'movies', text: 'What is the last movie that made you cry?', requiresResponse: true },
  { context: 'movies', text: 'Watched three films back to back yesterday, no regrets.', requiresResponse: false },
  { context: 'movies', text: 'Anyone seen anything good on streaming lately? I feel like I have scrolled through every single category on Netflix and Disney Plus without finding anything that actually catches my attention for more than five minutes.', requiresResponse: true },
  { context: 'movies', text: 'That plot twist was so obvious, saw it coming a mile away.', requiresResponse: false },
  { context: 'movies', text: 'The cinematography in that film was absolutely stunning.', requiresResponse: false },

  { context: 'food', text: 'Tried making sourdough from scratch, it actually turned out great. The crust was perfectly crispy and the inside had that airy, chewy texture that is so hard to achieve without a lot of patience and practice.', requiresResponse: false },
  { context: 'food', text: 'Best street food you have ever had?', requiresResponse: true },
  { context: 'food', text: 'Cast iron pans are a game changer for everything.', requiresResponse: false },
  { context: 'food', text: 'Meal prepping on Sundays saves the entire week. It takes a few hours of intensive chopping and cooking, but not having to worry about what to eat for lunch or dinner on a busy Wednesday is a huge relief.', requiresResponse: false },
  { context: 'food', text: 'Hot take: pineapple absolutely belongs on pizza.', requiresResponse: true },
  { context: 'food', text: 'Homemade pasta is easier than people think.', requiresResponse: false },
  { context: 'food', text: 'Found this amazing hole-in-the-wall restaurant downtown. It only has four tables and a handwritten menu, but the flavors were more sophisticated and delicious than most of the five-star places I have visited recently.', requiresResponse: false },
  { context: 'food', text: 'Air fryer is the best kitchen gadget I have ever bought.', requiresResponse: false },
  { context: 'food', text: 'Anyone tried fermenting their own kimchi?', requiresResponse: true },
  { context: 'food', text: 'Brunch is the best meal of the week, no contest. There is just something incredibly relaxing about waking up late and enjoying a mix of savory eggs and sweet pancakes while catching up with friends over coffee.', requiresResponse: false },
  { context: 'food', text: 'Tried a new recipe tonight and it was a total win.', requiresResponse: false },
  { context: 'food', text: 'Nothing beats fresh bread out of the oven.', requiresResponse: false },
  { context: 'food', text: 'What is your go-to comfort food? Whenever I am having a rough day, I always find myself gravitating toward a massive bowl of homemade macaroni and cheese with a thick layer of toasted breadcrumbs on top.', requiresResponse: true },
  { context: 'food', text: 'Farmers market haul was incredible this morning.', requiresResponse: false },
  { context: 'food', text: 'Slow cooker meals are underrated, set it and forget it.', requiresResponse: false },
]

export function getRandomMessage(context?: MessageContext): MessageTemplate {
  const pool = context ? messagePool.filter((m) => m.context === context) : messagePool
  return pool[Math.floor(Math.random() * pool.length)]
}

const thematicMapping: Record<string, MessageContext> = {
  'Weather Talk': 'weather',
  'Sports Arena': 'sports',
  'Music Lounge': 'music',
  'Movie Night': 'movies',
  'Food & Cooking': 'food',
}

export function getThematicMessage(roomName: string): MessageTemplate {
  const context = thematicMapping[roomName]
  if (context) {
    return getRandomMessage(context)
  }

  const generalPool = messagePool.filter(
    (m) => !['weather', 'sports', 'music', 'movies', 'food'].includes(m.context),
  )
  return generalPool[Math.floor(Math.random() * generalPool.length)]
}

export function getResponseMessage(): MessageTemplate {
  return getRandomMessage('response')
}

export function getGreetingMessage(): MessageTemplate {
  return getRandomMessage('greeting')
}

export function getFarewellMessage(): MessageTemplate {
  return getRandomMessage('farewell')
}
