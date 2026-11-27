# Overhead space and foreground depth

Approved direction: softly blur/darken the bottom 15–20% of scenery and add overhead architecture/canopy/clouds in all three areas. Keep fighters, standing positions, card geometry and gameplay unchanged.

Implementation: generate sibling backdrop assets from each current courtyard, retain originals, and select the overhead variants in combat. Put a masked backdrop blur in the bottom20% inside the stage below the actor layer and below the separate hand/HUD. No blur on the full stage or character sprites.

Verification: all existing Node tests, normal/high-resolution asset references, actual combat render in each biome, crisp cards/actors above the blur, ground contact, and no interception of card/target input. Publish a separate review branch stacked on the courtyard PR; do not merge into main without explicit merge approval.
