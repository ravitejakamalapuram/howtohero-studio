"""python3 -m unittest discover -s test   (run from pipeline2/; needs Pillow, not ffmpeg)"""
import json, os, sys, unittest
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
sys.path.insert(0, ROOT)
import verify as V

WHITE, BLACK = (255, 255, 255), (0, 0, 0)
with open(os.path.join(ROOT, "styles", "registry.json")) as fh: REG = json.load(fh)

def band(paper, ink, plate=None, text=True):
    """a caption band as the brand layer draws it: two rows of thick strokes, optionally on a plate"""
    im = Image.new("RGB", (960, 168), paper); d = ImageDraw.Draw(im)
    if plate: d.rectangle((100, 20, 860, 150), fill=plate)
    if text:
        for y in (40, 100):
            for x in range(140, 820, 22): d.rectangle((x, y, x + 6, y + 30), fill=ink)
    return im

def frame(paper, fmt="short"):
    f = V.FORMATS[fmt]; im = Image.new("RGB", (f["W"], f["H"]), paper)
    return im, ImageDraw.Draw(im)

class Colour(unittest.TestCase):
    def test_hex(self):
        self.assertEqual(V.hex_rgb("#1d5596"), (0x1D, 0x55, 0x96))
        self.assertEqual(V.hex_rgb("FBFAF6"), (0xFB, 0xFA, 0xF6))

    def test_luminance(self):
        self.assertAlmostEqual(V.lum(BLACK), 0); self.assertAlmostEqual(V.lum(WHITE), 1)
        self.assertAlmostEqual(V.lum((255, 0, 0)), 0.2126, 4); self.assertAlmostEqual(V.lum((0, 255, 0)), 0.7152, 4)
        self.assertAlmostEqual(V.lum((128, 128, 128)), 0.2158, 3)

    def test_contrast(self):
        self.assertAlmostEqual(V.contrast(BLACK, WHITE), 21); self.assertAlmostEqual(V.contrast(WHITE, BLACK), 21)
        self.assertAlmostEqual(V.contrast((90, 90, 90), (90, 90, 90)), 1)
        self.assertAlmostEqual(V.contrast((0x76, 0x76, 0x76), WHITE), 4.54, 2)  # the lightest grey that passes on white
        self.assertLess(V.contrast((0x77, 0x77, 0x77), WHITE), V.MIN_CAPTION)
        self.assertAlmostEqual(V.contrast((0, 0, 255), WHITE), 8.59, 2)

    def test_luma_of(self):
        self.assertEqual(V.luma_of(WHITE), "light"); self.assertEqual(V.luma_of(BLACK), "dark")
        for k in REG: self.assertEqual(V.luma_of(V.hex_rgb(k["paper"])), k["luma"], k["slug"])  # the registry agrees with its own paper

    def test_kit(self):
        for k in REG: self.assertEqual(V.kit(k["slug"]), (V.hex_rgb(k["paper"]), k["luma"]))
        self.assertEqual(V.kit("blueprint", "#ffffff")[1], "dark")  # the registry wins over --paper
        self.assertEqual(V.kit("_template", "#f6f4ee"), ((0xF6, 0xF4, 0xEE), "light"))
        self.assertEqual(V.kit("not-a-kit", "#101820")[1], "dark")
        with self.assertRaises(SystemExit): V.kit("not-a-kit")

class Captions(unittest.TestCase):
    def test_dark_ink_on_light_paper(self):
        self.assertAlmostEqual(V.caption_contrast(band((247, 247, 243), (34, 36, 42)), "light"), V.contrast((247, 247, 243), (34, 36, 42)), 1)

    def test_chalk_on_dark_board(self):
        self.assertAlmostEqual(V.caption_contrast(band((0x22, 0x32, 0x2A), (240, 240, 230)), "dark"), V.contrast((0x22, 0x32, 0x2A), (240, 240, 230)), 1)

    def test_low_contrast_fails(self):
        self.assertLess(V.caption_contrast(band(WHITE, (150, 150, 150)), "light"), V.MIN_CAPTION)
        self.assertLess(V.caption_contrast(band((0x1D, 0x55, 0x96), (90, 140, 200)), "dark"), V.MIN_CAPTION)

    def test_no_caption_reads_as_no_contrast(self):
        self.assertLess(V.caption_contrast(band(WHITE, BLACK, text=False), "light"), 1.1)
        self.assertLess(V.caption_contrast(band((0x22, 0x32, 0x2A), WHITE, text=False), "dark"), 1.1)

    def test_measured_against_the_plate_not_the_paper(self):
        ink, plate, paper = (30, 30, 30), (120, 120, 120), WHITE  # readable on the paper, not on its grey plate
        self.assertGreater(V.contrast(ink, paper), V.MIN_CAPTION)
        self.assertAlmostEqual(V.caption_contrast(band(paper, ink, plate), "light"), V.contrast(ink, plate), 1)
        self.assertLess(V.caption_contrast(band(paper, ink, plate), "light"), V.MIN_CAPTION)
        # light text on a darker plate over blue paper: fine
        self.assertGreater(V.caption_contrast(band((0x1D, 0x55, 0x96), (235, 240, 250), (0x12, 0x35, 0x60)), "dark"), V.MIN_CAPTION)

    def test_band_is_the_caption_area(self):
        im, _ = frame(WHITE)
        self.assertEqual(V.caption_band(im, "short").size, (880, 168))
        self.assertEqual(V.caption_band(im, "short").getbbox()[1], 0)
        im, _ = frame(WHITE, "doc")
        self.assertEqual(V.caption_band(im, "doc").size, (1680, 138))

class SafeZone(unittest.TestCase):
    def test_zone(self):
        self.assertEqual(V.safe_zone("short"), (50, 190, 950, 1599))
        self.assertEqual(V.safe_zone("short", 0.5), (25, 95, 475, 799))
        x0, y0, x1, y1 = V.safe_zone("doc")
        self.assertTrue(0 < x0 < x1 < 1920 and 0 < y0 < y1 < 1070)

    def test_content_is_what_stands_out_from_the_paper(self):
        for paper, ink, faint in [((247, 247, 243), (34, 36, 42), (225, 225, 220)), ((0x1D, 0x55, 0x96), (235, 240, 250), (0x35, 0x6D, 0xAE))]:
            im, d = frame(paper)
            d.rectangle((100, 300, 199, 399), fill=ink); d.rectangle((300, 300, 399, 399), fill=faint)  # ink, and a faint grid tone
            self.assertEqual(V.count(V.content_mask(im, paper)), 100 * 100)
            self.assertEqual(V.box_px(im, paper, "short"), 100 * 100)

    def test_inside_is_fine_outside_is_reported_by_side(self):
        paper, ink = (0x22, 0x32, 0x2A), (240, 240, 230)
        im, d = frame(paper)
        d.rectangle((60, 200, 939, 1359), outline=ink, width=6)    # the edge of the scene box (x 60-940: the right edge clears the like and comment buttons)
        d.rectangle((200, 1460, 880, 1540), fill=ink)              # a caption
        d.rectangle((0, 1910, 1079, 1919), fill=ink)               # the progress bar
        self.assertEqual(V.sides(V.outside(V.content_mask(im, paper), "short"), "short"), {})
        d.rectangle((300, 100, 399, 119), fill=ink); d.rectangle((1050, 600, 1069, 699), fill=ink); d.rectangle((500, 1700, 599, 1709), fill=ink); d.rectangle((0, 900, 9, 999), fill=ink)
        self.assertEqual(V.sides(V.outside(V.content_mask(im, paper), "short"), "short"), {"top": 2000, "right": 2000, "bottom": 1000, "left": 1000})

    def test_half_size_and_doc(self):
        im, d = frame(WHITE, "doc")
        d.rectangle((120, 70, 1799, 849), outline=BLACK, width=4); d.rectangle((1860, 400, 1899, 499), fill=BLACK)
        half = im.resize((960, 540), Image.NEAREST)
        self.assertEqual(V.sides(V.outside(V.content_mask(half, WHITE), "doc", 0.5), "doc", 0.5), {"right": 20 * 50})

class EndCard(unittest.TestCase):
    def test_cape_red_is_found_on_any_paper(self):
        for k in REG:
            im, d = frame(V.hex_rgb(k["paper"]))
            self.assertEqual(V.cape_px(im), 0, k["slug"])
            d.rectangle((400, 900, 499, 999), fill=V.CAPE); d.rectangle((600, 900, 699, 999), fill=(0xE0, 0x40, 0x48))  # the cape, and the cape after video compression
            self.assertEqual(V.cape_px(im), 2 * 100 * 100, k["slug"])
            d.rectangle((400, 900, 699, 999), fill=(0xD2, 0x3A, 0x2A))  # a kit's warning red is not the cape
            self.assertEqual(V.cape_px(im), 0, k["slug"])

if __name__ == "__main__":
    unittest.main()
