from typing import Protocol, runtime_checkable


class RampExhausted(Exception):
    """Raised by slow_down() when the ramp is already at its minimum step."""


@runtime_checkable
class RampStrategy(Protocol):
    """Contract for a stateful ramp strategy.

    The ramp owns its position in the sequence. ``current`` expresses the
    desired wave size. ``speed_up`` advances the sequence after a successful
    wave; ``slow_down`` retreats it when the desired size would exceed rate
    limit headroom. ``slow_down`` raises ``RampExhausted`` if already at the
    minimum step.
    """

    @property
    def current(self) -> int: ...

    def speed_up(self) -> None: ...

    def slow_down(self) -> None: ...


class Fibonacci:
    """Ramp strategy whose wave sizes follow the Fibonacci sequence.

    Steps: 1, 1, 2, 3, 5, 8, 13, ...

    Starts conservatively with a single warm-up request, then grows at a
    moderate pace — neither as aggressive as exponential nor as slow as
    linear — making it a good general-purpose default.
    """

    def __init__(self) -> None:
        self._step = 0

    @property
    def current(self) -> int:
        a, b = 1, 1
        for _ in range(self._step):
            a, b = b, a + b
        return a

    def speed_up(self) -> None:
        self._step += 1

    def slow_down(self) -> None:
        if self._step == 0:
            raise RampExhausted(
                "Ramp is already at minimum step (wave size 1) and cannot slow down further."
            )
        self._step -= 1
