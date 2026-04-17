-- Seed script: GRE/SAT Vocabulary Starter Deck
--
-- HOW TO USE:
-- 1. Open Supabase Dashboard → SQL Editor → New Query
-- 2. Paste this entire file
-- 3. Click Run
--
-- NOTE: This creates a deck owned by YOUR user account.
-- It finds your user_id automatically from your most recent sign-in.

DO $$
DECLARE
  v_user_id uuid;
  v_deck_id uuid;
BEGIN
  -- Grab the first (and likely only) user
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Sign in to the app first, then run this script.';
  END IF;

  -- Create the deck
  INSERT INTO public.decks (user_id, name, description)
  VALUES (v_user_id, 'GRE / SAT Vocabulary', 'High-frequency vocabulary words for standardized tests')
  RETURNING id INTO v_deck_id;

  -- Insert cards (front = word, back = definition + example)
  INSERT INTO public.cards (deck_id, front, back) VALUES
  (v_deck_id, 'Ubiquitous', 'Present, appearing, or found everywhere.

"Smartphones have become ubiquitous in modern society."'),

  (v_deck_id, 'Ephemeral', 'Lasting for a very short time.

"The ephemeral beauty of cherry blossoms draws crowds each spring."'),

  (v_deck_id, 'Pragmatic', 'Dealing with things sensibly and realistically; practical rather than idealistic.

"She took a pragmatic approach to solving the budget crisis."'),

  (v_deck_id, 'Equivocal', 'Open to more than one interpretation; ambiguous or uncertain.

"The senator gave an equivocal answer that satisfied no one."'),

  (v_deck_id, 'Laconic', 'Using very few words; concise to the point of seeming rude.

"His laconic reply — just "no" — ended the discussion."'),

  (v_deck_id, 'Perfunctory', 'Carried out with minimum effort or reflection; routine and superficial.

"She gave a perfunctory nod and returned to her work."'),

  (v_deck_id, 'Enervate', 'To drain of energy or vitality; to weaken.

"The long hike in the heat enervated the entire group."'),

  (v_deck_id, 'Sanguine', 'Optimistic or positive, especially in a difficult situation.

"Despite the setback, she remained sanguine about the project''s success."'),

  (v_deck_id, 'Truculent', 'Eager or quick to argue or fight; aggressively defiant.

"The truculent child refused every request with a scowl."'),

  (v_deck_id, 'Pellucid', 'Translucently clear; easily understood.

"Her pellucid writing style makes complex topics accessible."'),

  (v_deck_id, 'Prodigal', 'Spending money or resources freely and recklessly; wastefully extravagant.

"His prodigal spending habits caught up with him after college."'),

  (v_deck_id, 'Obdurate', 'Stubbornly refusing to change one''s opinion or course of action.

"The obdurate negotiator refused to make any concessions."'),

  (v_deck_id, 'Garrulous', 'Excessively talkative, especially on trivial matters.

"The garrulous cab driver narrated the entire city''s history."'),

  (v_deck_id, 'Ameliorate', 'To make something bad or unsatisfactory better; to improve.

"The new policy was designed to ameliorate working conditions."'),

  (v_deck_id, 'Recalcitrant', 'Having an obstinately uncooperative attitude toward authority.

"The recalcitrant student was sent to the principal''s office."'),

  (v_deck_id, 'Capricious', 'Given to sudden and unaccountable changes of mood or behavior; fickle.

"The capricious weather ruined our outdoor plans."'),

  (v_deck_id, 'Loquacious', 'Tending to talk a great deal; talkative.

"Her loquacious nature made her the life of every party."'),

  (v_deck_id, 'Furtive', 'Attempting to avoid notice or attention, typically because of guilt; secretive.

"He cast a furtive glance at the exam paper beside him."'),

  (v_deck_id, 'Vacillate', 'To alternate or waver between different opinions or actions; to be indecisive.

"She vacillated between accepting the job offer and staying put."'),

  (v_deck_id, 'Acerbic', 'Sharp and forthright in manner or tone, especially of speech or humor.

"The critic was known for his acerbic reviews."'),

  (v_deck_id, 'Anomalous', 'Deviating from what is standard, normal, or expected.

"The anomalous test result prompted the scientists to repeat the experiment."'),

  (v_deck_id, 'Quixotic', 'Exceedingly idealistic; unrealistic and impractical.

"His quixotic plan to end world hunger in a year impressed no investors."'),

  (v_deck_id, 'Taciturn', 'Reserved or uncommunicative in speech; saying little.

"The taciturn farmer answered every question with a single word."'),

  (v_deck_id, 'Mendacious', 'Not telling the truth; lying; dishonest.

"The mendacious witness was charged with perjury."'),

  (v_deck_id, 'Auspicious', 'Conducive to success; favorable.

"The sunny weather was an auspicious sign for the outdoor wedding."'),

  (v_deck_id, 'Diffident', 'Modest or shy because of a lack of self-confidence.

"The diffident student rarely raised her hand, despite knowing the answers."'),

  (v_deck_id, 'Parsimonious', 'Unwilling to spend money or use resources; excessively frugal.

"The parsimonious landlord refused to repair the leaking roof."'),

  (v_deck_id, 'Mitigate', 'To make less severe, serious, or painful.

"Sandbags were placed along the river to mitigate flood damage."'),

  (v_deck_id, 'Eschew', 'To deliberately avoid using; to abstain from.

"She eschewed social media entirely during exam season."'),

  (v_deck_id, 'Fastidious', 'Very attentive to and concerned about accuracy and detail.

"The fastidious editor caught every misplaced comma in the manuscript."');

  RAISE NOTICE 'Seeded deck "GRE / SAT Vocabulary" with 30 cards for user %', v_user_id;
END $$;
