class BlockLevel():
    level = 0

    def current(self): 
        return self.level

    def next(self):
        self.level += 1
        return self.current()

    def add(self, val):
        self.level += val
        return self.current()

    def addWithoutModify(self, val):
        return self.current() + val
