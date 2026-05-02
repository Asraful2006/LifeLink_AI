#
class Student:
    def __init__(self, name, marks):
        self.marks=marks
        self.name=name
    def get_avg(self):
        sum = 0
        for val in self.marks:
            sum+=val
        print("Si",self.name, "your avg score is:", sum/3)
s1 = Student("tony", [38,45,55])
s1.get_avg()

            
