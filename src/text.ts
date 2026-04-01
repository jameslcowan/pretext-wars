import { prepareWithSegments, layoutNextLine, type LayoutCursor } from '@chenglou/pretext';

export interface Poem {
  title: string;
  text: string;
  attribution: string;
}

export const POEMS: Poem[] = [
  {
    title: 'I dwell in Possibility',
    attribution: 'Emily Dickinson',
    text: `I dwell in Possibility
A fairer House than Prose
More numerous of Windows
Superior, for Doors

Of Chambers as the Cedars
Impregnable of eye
And for an Everlasting Roof
The Gambrels of the Sky

Of Visitors, the fairest
For Occupation, This
The spreading wide my narrow Hands
To gather Paradise`,
  },
  {
    title: 'Tell all the truth',
    attribution: 'Emily Dickinson',
    text: `Tell all the truth but tell it slant
Success in Circuit lies
Too bright for our infirm Delight
The Truth's superb surprise
As Lightning to the Children eased
With explanation kind
The Truth must dazzle gradually
Or every man be blind`,
  },
  {
    title: 'Hope is the thing with feathers',
    attribution: 'Emily Dickinson',
    text: `Hope is the thing with feathers
That perches in the soul
And sings the tune without the words
And never stops at all

And sweetest in the Gale is heard
And sore must be the storm
That could abash the little Bird
That kept so many warm

I have heard it in the chillest land
And on the strangest Sea
Yet never in Extremity
It asked a crumb of me`,
  },
  {
    title: 'Because I could not stop for Death',
    attribution: 'Emily Dickinson',
    text: `Because I could not stop for Death
He kindly stopped for me
The Carriage held but just Ourselves
And Immortality

We slowly drove He knew no haste
And I had put away
My labor and my leisure too
For His Civility

We passed the School where Children strove
At Recess in the Ring
We passed the Fields of Gazing Grain
We passed the Setting Sun`,
  },
  {
    title: 'I felt a Funeral in my Brain',
    attribution: 'Emily Dickinson',
    text: `I felt a Funeral in my Brain
And Mourners to and fro
Kept treading treading till it seemed
That Sense was breaking through

And when they all were seated
A Service like a Drum
Kept beating beating till I thought
My mind was going numb

And then I heard them lift a Box
And creak across my Soul
With those same Boots of Lead again
Then Space began to toll`,
  },
  {
    title: 'A Bird came down the Walk',
    attribution: 'Emily Dickinson',
    text: `A Bird came down the Walk
He did not know I saw
He bit an Angleworm in halves
And ate the fellow raw

And then he drank a Dew
From a convenient Grass
And then hopped sidewise to the Wall
To let a Beetle pass

He glanced with rapid eyes
That hurried all around
They looked like frightened Beads I thought
He stirred his Velvet Head`,
  },
  {
    title: 'Wild Nights',
    attribution: 'Emily Dickinson',
    text: `Wild Nights Wild Nights
Were I with thee
Wild Nights should be
Our luxury

Futile the winds
To a Heart in port
Done with the Compass
Done with the Chart

Rowing in Eden
Ah the Sea
Might I but moor
Tonight in thee`,
  },
  {
    title: 'I heard a Fly buzz',
    attribution: 'Emily Dickinson',
    text: `I heard a Fly buzz when I died
The Stillness in the Room
Was like the Stillness in the Air
Between the Heaves of Storm

The Eyes around had wrung them dry
And Breaths were gathering firm
For that last Onset when the King
Be witnessed in the Room

I willed my Keepsakes Signed away
What portion of me be
Assignable and then it was
There interposed a Fly`,
  },
  {
    title: 'The Soul selects her own Society',
    attribution: 'Emily Dickinson',
    text: `The Soul selects her own Society
Then shuts the Door
To her divine Majority
Present no more

Unmoved she notes the Chariots pausing
At her low Gate
Unmoved an Emperor be kneeling
Upon her Mat

I have known her from an ample nation
Choose One
Then close the Valves of her attention
Like Stone`,
  },
  {
    title: 'There is a certain Slant of light',
    attribution: 'Emily Dickinson',
    text: `There is a certain Slant of light
Winter Afternoons
That oppresses like the Heft
Of Cathedral Tunes

Heavenly Hurt it gives us
We can find no scar
But internal difference
Where the Meanings are

None may teach it Any
It is the seal Despair
An imperial affliction
Sent us of the Air`,
  },
  {
    title: 'I taste a liquor never brewed',
    attribution: 'Emily Dickinson',
    text: `I taste a liquor never brewed
From Tankards scooped in Pearl
Not all the Vats upon the Rhine
Yield such an Alcohol

Inebriate of Air am I
And Debauchee of Dew
Reeling through endless summer days
From inns of Molten Blue

When Landlords turn the drunken Bee
Out of the Foxgloves door
When Butterflies renounce their drams
I shall but drink the more`,
  },
  {
    title: 'Much Madness is divinest Sense',
    attribution: 'Emily Dickinson',
    text: `Much Madness is divinest Sense
To a discerning Eye
Much Sense the starkest Madness
It is the Majority
In this as all prevail
Assent and you are sane
Demur you are straightway dangerous
And handled with a Chain`,
  },
];

export function getRandomPoem(): Poem {
  return POEMS[Math.floor(Math.random() * POEMS.length)];
}

export interface Orb {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  className: string;
  el?: HTMLElement;
}

export interface LineData {
  text: string;
  x: number;
  y: number;
  width: number;
  startOffset: number; // absolute char offset in the original text
}

export function fontString(fontSize: number): string {
  return `${fontSize}px "Cantata One", Georgia, serif`;
}

export interface DropCapInfo {
  width: number;
  height: number;
}

export function layoutAroundOrbs(
  text: string,
  fontSize: number,
  lineHeight: number,
  stageWidth: number,
  stageHeight: number,
  padding: number,
  orbs: Orb[],
  dropCap?: DropCapInfo,
  topPadding?: number,
): LineData[] {
  const font = fontString(fontSize);
  const prepared = prepareWithSegments(text, font, { whiteSpace: 'pre-wrap' });

  const lines: LineData[] = [];
  const baseLeft = padding;
  const baseRight = stageWidth - padding;

  let y = topPadding ?? padding;
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  let textPtr = 0; // tracks position in original text

  while (y + lineHeight < stageHeight - 80) {
    let lineLeft = baseLeft;
    let lineRight = baseRight;

    if (dropCap && lines.length > 0 && lines.length < Math.ceil(dropCap.height / lineHeight)) {
      lineLeft = Math.max(lineLeft, padding + dropCap.width + 8);
    }

    for (const orb of orbs) {
      const closestY = Math.max(y, Math.min(y + lineHeight, orb.y));
      const dy = closestY - orb.y;
      const halfChord = Math.sqrt(Math.max(0, orb.r * orb.r - dy * dy));

      if (halfChord > 0) {
        const orbLeft = orb.x - halfChord;
        const orbRight = orb.x + halfChord;
        const spaceOnLeft = orbLeft - lineLeft;
        const spaceOnRight = lineRight - orbRight;
        const margin = 20;
        if (spaceOnLeft > spaceOnRight) {
          lineRight = Math.min(lineRight, orbLeft - margin);
        } else {
          lineLeft = Math.max(lineLeft, orbRight + margin);
        }
      }
    }

    const availableWidth = Math.max(40, lineRight - lineLeft);
    const result = layoutNextLine(prepared, cursor, availableWidth);
    if (!result) break;

    const trimmed = result.text.replace(/\s/g, '');
    if (trimmed.length === 0) {
      // Stanza break: advance textPtr past whitespace/newlines
      while (textPtr < text.length && (text[textPtr] === '\n' || text[textPtr] === '\r' || text[textPtr] === ' ')) {
        textPtr++;
      }
      y += lineHeight * 0.6;
      cursor = result.end;
      continue;
    }

    // Find where this line's text starts in the original
    const searchText = result.text.trimEnd();
    const idx = text.indexOf(searchText, textPtr);
    const startOffset = idx >= 0 ? idx : textPtr;
    textPtr = startOffset + searchText.length;

    lines.push({
      text: result.text,
      x: lineLeft,
      y,
      width: result.width,
      startOffset,
    });

    cursor = result.end;
    y += lineHeight;
  }

  return lines;
}
