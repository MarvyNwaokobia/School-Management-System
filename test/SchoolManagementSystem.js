const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("SchoolManagementSystem", function () {
  async function deploySchoolManagementSystemFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const SchoolManagementSystem = await ethers.getContractFactory("SchoolManagementSystem");
    const school = await SchoolManagementSystem.deploy();

    return { school, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should deploy with zero students", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      expect(await school.getStudentCount()).to.equal(0);
    });
  });

  describe("registerStudent", function () {
    it("Should register a student and emit StudentRegistered event", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await expect(school.registerStudent("Alice", 20))
        .to.emit(school, "StudentRegistered")
        .withArgs(1, "Alice", 20, 0); // Status.ACTIVE == 0
    });

    it("Should increment student count after registration", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await school.registerStudent("Alice", 20);
      await school.registerStudent("Bob", 22);

      expect(await school.getStudentCount()).to.equal(2);
    });

    it("Should revert if name is empty", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await expect(school.registerStudent("", 20)).to.be.revertedWith("Name cannot be empty");
    });

    it("Should revert if age is zero", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await expect(school.registerStudent("Alice", 0)).to.be.revertedWith("Age must be greater than 0");
    });
  });

  describe("getStudent", function () {
    it("Should return the correct student data", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await school.registerStudent("Alice", 20);
      const [id, name, age, status] = await school.getStudent(1);

      expect(id).to.equal(1);
      expect(name).to.equal("Alice");
      expect(age).to.equal(20);
      expect(status).to.equal(0); // Status.ACTIVE
    });

    it("Should revert when student does not exist", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await expect(school.getStudent(999)).to.be.revertedWith("Student does not exist");
    });
  });

  describe("updateStudent", function () {
    it("Should update student name and age and emit StudentUpdated event", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await school.registerStudent("Alice", 20);
      await expect(school.updateStudent(1, "Alice Updated", 21))
        .to.emit(school, "StudentUpdated")
        .withArgs(1, "Alice Updated", 21, 0); // Status.ACTIVE
    });

    it("Should revert when updating a non-existent student", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await expect(school.updateStudent(999, "Alice", 20)).to.be.revertedWith("Student does not exist");
    });

    it("Should revert when updating with empty name", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await school.registerStudent("Alice", 20);
      await expect(school.updateStudent(1, "", 20)).to.be.revertedWith("Name cannot be empty");
    });

    it("Should revert when updating with zero age", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await school.registerStudent("Alice", 20);
      await expect(school.updateStudent(1, "Alice", 0)).to.be.revertedWith("Age must be greater than 0");
    });
  });

  describe("updateStudentStatus", function () {
    it("Should update student status to DEFERRED", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await school.registerStudent("Alice", 20);
      await school.updateStudentStatus(1, 1); // Status.DEFERRED == 1
      const [, , , status] = await school.getStudent(1);

      expect(status).to.equal(1); // Status.DEFERRED
    });

    it("Should update student status to RUSTICATED", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await school.registerStudent("Alice", 20);
      await school.updateStudentStatus(1, 2); // Status.RUSTICATED == 2
      const [, , , status] = await school.getStudent(1);

      expect(status).to.equal(2); // Status.RUSTICATED
    });

    it("Should revert when updating status of non-existent student", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await expect(school.updateStudentStatus(999, 1)).to.be.revertedWith("Student does not exist");
    });
  });

  describe("deleteStudent", function () {
    it("Should delete a student and emit StudentDeleted event", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await school.registerStudent("Alice", 20);
      await expect(school.deleteStudent(1))
        .to.emit(school, "StudentDeleted")
        .withArgs(1);
    });

    it("Should decrement student count after deletion", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await school.registerStudent("Alice", 20);
      await school.registerStudent("Bob", 22);
      await school.deleteStudent(1);

      expect(await school.getStudentCount()).to.equal(1);
    });

    it("Should revert when deleting a non-existent student", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await expect(school.deleteStudent(999)).to.be.revertedWith("Student does not exist");
    });

    it("Should not return deleted student in getAllStudents", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await school.registerStudent("Alice", 20);
      await school.registerStudent("Bob", 22);
      await school.deleteStudent(1);

      const allStudents = await school.getAllStudents();
      expect(allStudents.length).to.equal(1);
      expect(allStudents[0].name).to.equal("Bob");
    });
  });

  describe("getAllStudents", function () {
    it("Should return all active students", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      await school.registerStudent("Alice", 20);
      await school.registerStudent("Bob", 22);

      const allStudents = await school.getAllStudents();
      expect(allStudents.length).to.equal(2);
    });

    it("Should return an empty array when there are no students", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystemFixture);

      const allStudents = await school.getAllStudents();
      expect(allStudents.length).to.equal(0);
    });
  });
});
