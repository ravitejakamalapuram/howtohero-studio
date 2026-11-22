#!/usr/bin/env python3
"""Second opinion from a stronger model at the jobs' key decisions.

    python3 advisor.py <cards|script> <file>        ask the advisor, print its advice
    python3 advisor.py <cards|script> <file> --prompt   print the full prompt only (for the fallback)

Exit 0: advice printed on stdout. Exit 3: no advice; the first line says
"FALLBACK: <reason>" and the job uses the in-session fallback (SKILL.md "Advisor").
The key comes from HTH_ADVISOR_KEY, never ANTHROPIC_API_KEY, so Claude Code's own
session never picks it up and bills the user's API credits.
"""
import json, os, signal, sys, time

MODEL = "claude-fable-5-2"           # strongest generally available model
PRICE_IN, PRICE_OUT = 8.0, 40.0      # $ per million tokens
PRICE_SEARCH = 0.01                  # $ per web search
RUN_BUDGET = float(os.environ.get("HTH_ADVISOR_RUN_BUDGET", "2.00"))  # $ per job run
SPEND_FILE = "/tmp/hth-advisor-spend.json"
MAX_SECONDS = int(os.environ.get("HTH_ADVISOR_MAX_SECONDS", "240"))  # whole call, web search included; past it the job uses the in-session fallback

ROLE = ("You are the senior editor of How To Hero, a channel of short vertical science and "
        "engineering explainers. A junior producer (another AI) asks you to review its work. "
        "You may use web search to check facts. Be strict about accuracy and about what makes "
        "a viewer stay past the first 3 seconds; be brief everywhere else.")

TASKS = {
    "cards": (
        "Below are the candidate cards (news stories and video ideas) the scout drafted today, "
        "with the duplicate-check output. For EACH card, reply with one line:\n"
        "<card title> | KEEP or FIX or DROP | <reason, max 25 words> | <for FIX: the exact change>\n"
        "DROP a card that is stale, badly sourced, a duplicate of an earlier video, "
        "unlikely to hold viewers, or has a number you could not confirm. Check every number "
        "and date in news cards against a source. After the list, add one line: "
        "BEST: <the 3 strongest titles in order>."
    ),
    "script": (
        "Below is a video script (hook, spoken beats, end card) with its sources, before render. "
        "Check every factual claim, number and date against a source. Then reply:\n"
        "FACTS: OK, or one line per problem: <beat number> | <what is wrong> | <correct wording> | <source URL>\n"
        "HOOK: OK, or a better 2-line hook (max 22 chars per line) and why\n"
        "SCRIPT: OK, or at most 3 concrete fixes (beat number + new wording) for clarity or retention\n"
        "VERDICT: RENDER, or FIX (apply the fixes above, then render), or STOP (the core claim is wrong)."
    ),
}


def fallback(reason):
    print(f"FALLBACK: {reason}")
    sys.exit(3)


def spent():
    try:
        return json.load(open(SPEND_FILE))["usd"]
    except Exception:
        return 0.0


def cost(usage):
    searches = getattr(getattr(usage, "server_tool_use", None), "web_search_requests", 0) or 0
    tokens_in = (usage.input_tokens or 0) + (usage.cache_creation_input_tokens or 0) * 1.25 \
        + (usage.cache_read_input_tokens or 0) * 0.1
    return tokens_in * PRICE_IN / 1e6 + (usage.output_tokens or 0) * PRICE_OUT / 1e6 + searches * PRICE_SEARCH


def main():
    if len(sys.argv) < 3 or sys.argv[1] not in TASKS:
        sys.exit(__doc__)
    task, path = sys.argv[1], sys.argv[2]
    prompt = TASKS[task] + "\n\n---\n" + open(path).read()
    if "--prompt" in sys.argv:
        print(ROLE + "\n\n" + prompt)
        return

    key = os.environ.get("HTH_ADVISOR_KEY")
    if not key:
        fallback("no HTH_ADVISOR_KEY in this environment")
    if spent() >= RUN_BUDGET:
        fallback(f"this run's advisor budget (${RUN_BUDGET:.2f}) is used up")
    try:
        import anthropic
    except ImportError:
        os.system(f"{sys.executable} -m pip install -q anthropic >/dev/null 2>&1")
        try:
            import anthropic
        except ImportError:
            fallback("could not install the anthropic package")

    def too_slow(*_):
        raise TimeoutError
    signal.signal(signal.SIGALRM, too_slow)  # the SDK's own timeout only covers idle reads, so cap the wall clock
    signal.alarm(MAX_SECONDS)
    client = anthropic.Anthropic(api_key=key, base_url="https://api.anthropic.com")
    messages = [{"role": "user", "content": prompt}]
    total, start = 0.0, time.time()
    try:
        for _ in range(4):  # web search may pause a long turn; continue it
            with client.beta.messages.stream(
                model=MODEL,
                max_tokens=32000,
                system=ROLE,
                output_config={"effort": "high"},
                tools=[{"type": "web_search_20260209", "name": "web_search", "max_uses": 6}],
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
                messages=messages,
            ) as stream:
                msg = stream.get_final_message()
            total += cost(msg.usage)
            if msg.stop_reason != "pause_turn":
                break
            messages = messages + [{"role": "assistant", "content": msg.content}]
    except (anthropic.AuthenticationError, anthropic.PermissionDeniedError):
        fallback("the advisor key was refused (wrong, revoked or no access)")
    except anthropic.APIStatusError as e:
        text = str(e).lower()
        if e.status_code == 402 or "credit" in text or "billing" in text:
            fallback("API credits are used up")
        fallback(f"API error {e.status_code} ({getattr(e, 'type', '')})")
    except TimeoutError:
        fallback(f"no answer within {MAX_SECONDS} s")
    except anthropic.APIConnectionError:
        fallback("could not reach the API")
    finally:
        signal.alarm(0)
        if total:
            json.dump({"usd": spent() + total}, open(SPEND_FILE, "w"))

    if msg.stop_reason == "refusal":
        fallback("the advisor declined this request")
    advice = "\n".join(b.text for b in msg.content if b.type == "text").strip()
    if not advice:
        fallback("the advisor returned no text")
    print(advice)
    print(f"\n[advisor: {msg.model}, ${total:.3f} this call, ${spent():.3f} this run, "
          f"{time.time() - start:.0f} s]")


if __name__ == "__main__":
    main()
