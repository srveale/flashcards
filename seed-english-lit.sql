-- Seed script: English Literature 101 (First Year University)
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
  VALUES (v_user_id, 'English Literature 101', 'Literary terms, movements, and concepts for first-year university study')
  RETURNING id INTO v_deck_id;

  -- Insert cards (front = term, back = definition + explanation)
  INSERT INTO public.cards (deck_id, front, back) VALUES
  (v_deck_id, 'Metaphor', 'A direct comparison between two unlike things without using "like" or "as."

"The world is a stage" directly compares the world to a theatrical stage, suggesting life is a performance with roles and an audience.'),

  (v_deck_id, 'Simile', 'A comparison between two unlike things using "like" or "as."

"Her love was like a burning flame" explicitly uses "like" to compare abstract emotion to concrete fire.'),

  (v_deck_id, 'Symbolism', 'The use of objects, characters, or actions to represent abstract ideas or deeper meanings.

In "The Great Gatsby," the green light symbolizes Gatsby''s dreams and the allure of wealth.'),

  (v_deck_id, 'Irony', 'A contrast between what is expected and what actually occurs, or what is said and what is meant.

In "A Modest Proposal," Jonathan Swift uses irony to satirize by seriously suggesting eating babies.'),

  (v_deck_id, 'Foreshadowing', 'A narrative technique where hints or clues suggest future events.

In Shakespeare''s "Macbeth," the witches'' prophecies foreshadow the tragic events to come.'),

  (v_deck_id, 'Allusion', 'An indirect or passing reference to another literary work, person, event, or idea.

A character''s "Trojan horse" strategy alludes to Homer''s Iliad without explicitly stating the reference.'),

  (v_deck_id, 'Hyperbole', 'Extreme exaggeration used for emphasis, humor, or effect.

"I''ve told you a million times" uses hyperbole rather than literal truth for dramatic emphasis.'),

  (v_deck_id, 'Personification', 'Giving human qualities or characteristics to non-human things, objects, or ideas.

"The wind whispered through the trees" gives the wind a human ability to whisper.'),

  (v_deck_id, 'Protagonist', 'The main character in a literary work who typically drives the narrative forward.

In "Jane Eyre," Jane Eyre is the protagonist whose personal journey shapes the entire novel.'),

  (v_deck_id, 'Antagonist', 'The character, force, or circumstance that opposes the protagonist.

Bertha Mason and Mr. Rochester''s secrets act as antagonistic forces in "Jane Eyre."'),

  (v_deck_id, 'Romanticism', 'A literary and artistic movement emphasizing emotion, nature, individualism, and imagination over reason (late 1700s–1850s).

Wordsworth and Keats rejected Enlightenment rationalism, celebrating nature and personal feeling.'),

  (v_deck_id, 'Modernism', 'A 20th-century movement rejecting traditional narratives and forms, embracing fragmentation, stream-of-consciousness, and experimentation.

Joyce''s "Ulysses" breaks conventional narrative structure and uses interior monologue.'),

  (v_deck_id, 'Victorian Era', 'The period of Queen Victoria''s reign (1837–1901), marked by rapid industrialization, moral conservatism, and complex social issues.

Dickens, the Brontës, and Eliot produced major works addressing poverty, gender, and morality.'),

  (v_deck_id, 'Gothic Literature', 'A genre combining horror, mystery, and the supernatural, often set in gloomy medieval settings and exploring dark psychology.

"Frankenstein" and "Wuthering Heights" are Gothic masterpieces featuring dark atmospheres and psychological depth.'),

  (v_deck_id, 'Realism', 'A literary movement depicting life as it actually is, with realistic characters, settings, and conflicts, rejecting idealization.

Flaubert''s "Madame Bovary" unflinchingly portrays the mundane and disappointing aspects of provincial life.'),

  (v_deck_id, 'Stream of Consciousness', 'A narrative technique that mimics the flow of a character''s thoughts, often appearing fragmented and nonlinear.

Virginia Woolf uses stream of consciousness to reveal characters'' inner psychological experiences.'),

  (v_deck_id, 'Unreliable Narrator', 'A narrator whose perception or account of events is distorted by mental illness, bias, prejudice, or deception.

The narrator of Nabokov''s "Lolita" manipulates readers with charm while committing moral horrors.'),

  (v_deck_id, 'Plot', 'The sequence of events that make up a story, typically including exposition, rising action, climax, falling action, and resolution.

A well-structured plot guides the reader through conflict and toward a meaningful conclusion.'),

  (v_deck_id, 'Theme', 'A central idea or underlying meaning explored throughout a literary work.

"Lord of the Flies" explores the theme that civilization is fragile and that humans have an innate capacity for savagery.'),

  (v_deck_id, 'Tone', 'The author''s attitude toward the subject matter or audience, conveyed through word choice, imagery, and style.

Austen''s tone in "Pride and Prejudice" is witty, ironic, and gently satirical toward social conventions.'),

  (v_deck_id, 'Mood', 'The emotional atmosphere or feeling created for the reader through setting, imagery, and language.

The dark, stormy mood in "Wuthering Heights" reflects the characters'' turbulent emotions and relationships.'),

  (v_deck_id, 'Tragic Hero', 'A protagonist of noble stature who experiences a catastrophic downfall due to a tragic flaw or the conflict between will and destiny.

King Lear''s pride and poor judgment lead to his tragic downfall and madness.'),

  (v_deck_id, 'Bildungsroman', 'A novel dealing with the spiritual, moral, and psychological growth of the protagonist from youth to adulthood.

"Jane Eyre" and "Great Expectations" are Bildungsromans tracing the coming-of-age journeys of their protagonists.'),

  (v_deck_id, 'Satire', 'The use of humor, irony, or exaggeration to criticize or ridicule human behavior, institutions, or ideas.

Swift''s "A Modest Proposal" satirizes public indifference to Irish poverty through shocking irony.'),

  (v_deck_id, 'Critique', 'A detailed analysis and evaluation of a work''s strengths and weaknesses, often in historical, social, or theoretical context.

Marxist critique examines how literature reflects class structures and capitalist power dynamics.'),

  (v_deck_id, 'Intertextuality', 'The relationship between texts where one text references, quotes, or is influenced by another.

T.S. Eliot''s "The Waste Land" uses intertextuality by referencing Shakespeare, Dante, and the Bible.'),

  (v_deck_id, 'Deconstruction', 'A critical approach that questions the stability of meaning, revealing contradictions and hidden assumptions in texts.

Derrida''s deconstruction challenges the idea that texts have single, fixed meanings.'),

  (v_deck_id, 'Feminist Criticism', 'A critical approach examining how gender is represented, how women are portrayed, and how literary institutions reflect patriarchal power.

Feminist critics reassess texts like "The Yellow Wallpaper" to uncover critiques of female oppression.'),

  (v_deck_id, 'Metafiction', 'Fiction that is self-conscious about its own status as fiction, often commenting on its construction or fictional nature.

Borges'' "The Garden of Forking Paths" is metafictional, blurring the boundaries between story and reality.'),

  (v_deck_id, 'Postmodernism', 'A late 20th-century movement skeptical of grand narratives, embracing playfulness, pastiche, and the dissolution of boundaries between high and low culture.

Pynchon''s fiction fragments reality and questions whether coherent truth can be represented.'),

  (v_deck_id, 'Canon', 'The body of works considered the most important, influential, or worthy of study within a literary tradition.

The literary canon has traditionally excluded women and writers of color, prompting ongoing revision.');

  RAISE NOTICE 'Seeded deck "English Literature 101" with 30 cards for user %', v_user_id;
END $$;
